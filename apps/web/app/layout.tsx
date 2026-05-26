import type { Metadata } from "next";

import "./globals.css";
import { GlobalProviders } from "~/providers/global";

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
  <body>
    <GlobalProviders>{children}</GlobalProviders>
  </body>
</html>
  );
}
