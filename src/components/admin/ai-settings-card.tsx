"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateAiSettingsAction } from "@/lib/actions/ai-settings";
import {
  AI_MODELS,
  AI_MODEL_LABELS,
  DEFAULT_AI_MODEL,
  isAllowedAiModel,
  type AiModel,
} from "@/lib/validations/settings";

type Props = {
  initial: {
    aiEnabled: boolean;
    aiModel: string;
    aiMinConfidence: number;
  };
};

export function AiSettingsCard({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.aiEnabled);
  const [model, setModel] = useState<AiModel>(
    isAllowedAiModel(initial.aiModel) ? initial.aiModel : DEFAULT_AI_MODEL,
  );
  const [confidence, setConfidence] = useState<number>(initial.aiMinConfidence);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateAiSettingsAction({
        aiEnabled: enabled,
        aiModel: model,
        aiMinConfidence: confidence,
      });
      if (result.ok) {
        toast.success("AI settings updated.");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          AI Waste Recognition
        </CardTitle>
        <CardDescription>
          Auto-classify pickup photos with Gemini. Matching requests are auto-approved;
          mismatches and non-waste images stay pending for admin review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ai-enabled">Enable AI classification</Label>
            <p className="text-xs text-muted-foreground mt-1">
              When off, all new requests stay pending as before.
            </p>
          </div>
          <Switch id="ai-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label>Gemini model</Label>
          <Select
            value={model}
            onValueChange={(v) => {
              if (isAllowedAiModel(v)) setModel(v);
            }}
            disabled={!enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {AI_MODEL_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Minimum confidence for auto-approve</Label>
            <span className="text-sm font-medium">{Math.round(confidence * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[confidence]}
            onValueChange={(v) => setConfidence(v[0] ?? 0.7)}
            disabled={!enabled}
          />
          <p className="text-xs text-muted-foreground">
            Below this threshold, requests stay pending for manual review.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
