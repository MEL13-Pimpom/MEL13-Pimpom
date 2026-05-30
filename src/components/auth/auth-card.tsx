import Image from "next/image";
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
        <div className="mb-4">
          <Image
            src="/logo.png"
            alt="Recycling Pickup Scheduler"
            width={240}
            height={96}
            priority
            className="h-24 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-foreground text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2 text-center">{subtitle}</p>
        )}
      </div>
      {children}
      {footer && <div className="mt-4 text-center">{footer}</div>}
    </div>
  );
}
