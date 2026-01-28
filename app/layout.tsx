import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Fragments",
  description: "AI Code Generator - Powered by Ollama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
