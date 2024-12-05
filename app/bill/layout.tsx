import type { Metadata } from "next";
 import "../globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

 
export const metadata: Metadata = {
  title: "Order Bill",
  description: "",
};
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
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


 