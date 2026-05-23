import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "FTHEFORM",
    template: "%s | FTHEFORM",
  },
  description:
    "Create, share, and manage forms with a modern seamless experience.",
  keywords: [
    "forms",
    "form builder",
    "survey tool",
    "online forms",
    "data collection",
    "FTHEFORM",
  ],
  authors: [{ name: "Kunal Madoliya" }],
  creator: "Kunal Madoliya",
  metadataBase: new URL("https://ftform.kunalmadoliya.me"),

  openGraph: {
    title: "FTHEFORM",
    description:
      "Create, share, and manage forms with a modern seamless experience.",
    url: "https://ftform.kunalmadoliya.me",
    siteName: "FTHEFORM",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "FTHEFORM",
    description:
      "Create, share, and manage forms with a modern seamless experience.",
  },

  applicationName: "FTHEFORM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" suppressHydrationWarning>
  <body className={`${geistSans.variable} ${geistMono.variable}`}>
    <GlobalProviders>{children}</GlobalProviders>
  </body>
</html>
  );
}
