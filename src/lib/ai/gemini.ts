import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import {
  AI_CATEGORIES,
  aiClassificationSchema,
  type AiClassification,
} from "@/lib/validations/ai";
import { DEFAULT_AI_MODEL, isAllowedAiModel, type AiModel } from "@/lib/validations/settings";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

function resolveModel(model: string | null | undefined): AiModel {
  if (model && isAllowedAiModel(model)) return model;
  return DEFAULT_AI_MODEL;
}

const PROMPT = `You are a waste-sorting assistant for a residential recycling app.
Classify the photo into exactly ONE of these categories:
- paper: cardboard, newspaper, office paper, magazines.
- plastic: bottles, packaging film, plastic containers.
- metal: cans, foil, scrap metal.
- glass: bottles, jars.
- electronic: phones, batteries, cables, e-waste.
- mixed: clearly multiple recyclable categories together.
- notwaste: anything that is NOT recyclable waste (people, pets, food on a plate, empty rooms, random objects, screenshots, etc.).

Rules:
- isWaste MUST be false if and only if category is "notwaste".
- confidence is your own probability that the chosen category is correct, in [0,1].
- reason is a short (<= 200 chars) human-readable explanation in English.
Return JSON only.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: [...AI_CATEGORIES],
    },
    isWaste: { type: Type.BOOLEAN },
    confidence: { type: Type.NUMBER },
    reason: { type: Type.STRING },
  },
  required: ["category", "isWaste", "confidence", "reason"],
  propertyOrdering: ["category", "isWaste", "confidence", "reason"],
};

export async function classifyWasteImage(
  base64Data: string,
  mimeType: string,
  model: string | null | undefined,
): Promise<AiClassification> {
  const resolvedModel = resolveModel(model);
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: resolvedModel,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: RESPONSE_SCHEMA as any,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned non-JSON output.");
  }

  const validated = aiClassificationSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Gemini output failed schema validation: ${validated.error.issues[0]?.message ?? "unknown"}`,
    );
  }

  const result = validated.data;
  // Enforce invariant: isWaste === false  <=>  category === 'notwaste'
  if ((result.category === "notwaste") !== (result.isWaste === false)) {
    if (result.category === "notwaste") {
      result.isWaste = false;
    } else {
      result.isWaste = true;
    }
  }
  return result;
}
