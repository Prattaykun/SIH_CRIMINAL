import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { ShellGate } from "@/components/layout/ShellGate";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GoyendaBondhu - Criminal Network Analysis System",
  description:
    "AI-powered multi-modal criminal network analysis, link prediction, and evidence traceability platform (Synthetic Data Prototype).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "dark",
        inter.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="min-h-full bg-black text-white flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
        <Providers>
          <ShellGate>{children}</ShellGate>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0c0c0c",
                color: "#f8fafc",
                border: "1px solid rgba(255,255,255,0.09)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
