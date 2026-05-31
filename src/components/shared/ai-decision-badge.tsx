import { Badge } from "@/components/ui/badge";
import { AI_DECISION_LABELS, type AiDecision } from "@/lib/validations/ai";
import { cn } from "@/lib/utils";

const TONE: Record<AiDecision, string> = {
  auto_approved: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  needs_review: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  skipped: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  error: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
};

export function AiDecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
        AI: —
      </Badge>
    );
  }
  const d = decision as AiDecision;
  const label = AI_DECISION_LABELS[d] ?? decision;
  return (
    <Badge variant="outline" className={cn("font-normal", TONE[d] ?? "")}>
      AI: {label}
    </Badge>
  );
}
