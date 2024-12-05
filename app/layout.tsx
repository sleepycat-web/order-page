import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
 
export const metadata: Metadata = {
  title: "Chai Mine Order",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark font-poppins">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
