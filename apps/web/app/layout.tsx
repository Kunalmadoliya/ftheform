import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FTHEFORM",
  description: "Create focused forms and collect better answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={poppins.variable}
    >
      <body className={`${poppins.className} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground selection:text-background`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
