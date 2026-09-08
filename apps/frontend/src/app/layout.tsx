import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

import { Providers } from "@/providers/Providers";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


export const metadata: Metadata = {
  title: "SIH 26189 - Criminal Network Analysis System",
  description:
    "AI-powered multi-modal criminal network analysis, link prediction, and evidence traceability platform (Synthetic Data Prototype).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "dark", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full bg-[#090c13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
        <Providers>
          <div className="min-h-screen flex flex-col bg-[#090c13]">
            <Header />
            <main className="flex-1 overflow-y-auto bg-[#090c13] p-5 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#121622', color: '#f8fafc', border: '1px solid #23293a' } }} />
        </Providers>
      </body>
    </html>
  );
}
