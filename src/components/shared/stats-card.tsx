import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "primary" | "amber" | "destructive";
  helper?: string;
}

const TONE: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-700",
  destructive: "bg-red-100 text-red-700",
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  helper,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", TONE[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold leading-tight">{value}</span>
          {helper && (
            <span className="text-xs text-muted-foreground mt-1">{helper}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
