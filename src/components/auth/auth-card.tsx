import { Recycle } from "lucide-react";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-border">
      <div className="flex flex-col items-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Recycle className="h-9 w-9 text-primary" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2 text-center">{subtitle}</p>
        )}
      </div>
      {children}
      {footer && <div className="mt-6 text-center">{footer}</div>}
    </div>
  );
}
