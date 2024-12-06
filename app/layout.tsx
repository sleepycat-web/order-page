import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
 
export const metadata: Metadata = {
  title: "Chai Mine Order",
  description: "",
};
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <html lang="en" className="bg-neutral-950" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </>
  );
};

export default RootLayout;


 
