import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/contexts/Web3Context";
import { Toaster } from "@/components/ui/toaster";
import Chatbot from "@/components/Chatbot";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "HealthChain | Decentralized Healthcare",
  description: "Next Generation Healthcare via Blockchain & AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Web3Provider>
          {children}
          <Toaster />
          <Chatbot />
        </Web3Provider>
      </body>
    </html>
  );
}
