import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const recycleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%234CAF50' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5'/><path d='M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12'/><path d='m14 16-3 3 3 3'/><path d='M8.293 13.596 7.196 9.5 3.1 10.598'/><path d='m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843'/><path d='m13.378 9.633 4.096 1.098 1.097-4.096'/></svg>`;

export const metadata: Metadata = {
  title: "Recycling Pickup Scheduler",
  description:
    "Schedule recycling pickups, manage requests, and coordinate collectors.",
  icons: {
    icon: [{ url: `data:image/svg+xml,${recycleSvg}`, type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
