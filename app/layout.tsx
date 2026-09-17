import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LeadChatLauncher from "../components/LeadChatLauncher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadFlow AI | Turn Visitors Into Clients",
  description: "An AI sales agent that qualifies leads and books meetings 24/7.",
  applicationName: "LeadFlow AI",
  openGraph: {
    title: "LeadFlow AI | Turn Visitors Into Clients",
    description: "An AI sales agent that qualifies leads and books meetings 24/7.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<LeadChatLauncher /></body>
    </html>
  );
}
