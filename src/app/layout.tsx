import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalHeader from "@/components/globalHeader/globalHeader";
import GlobalFooter from "@/components/globalFooter/globalFooter";
import { AppProviders } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "finsmart",
  description: "finsmart - your financial partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col overflow-hidden`}
        suppressHydrationWarning
      >
        <AppProviders>
          <GlobalHeader />
          <main className="flex-1 flex flex-col overflow-hidden min-h-0">
            {children}
          </main>
          <GlobalFooter />
        </AppProviders>
      </body>
    </html>
  );
}
