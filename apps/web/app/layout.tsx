import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEJOIY Enterprise Service Portal",
  description:
    "Enterprise portal for IT support, HR workflows, employment verification, background checks, learning center, and administration.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
        {children}
      </body>
    </html>
  );
}
