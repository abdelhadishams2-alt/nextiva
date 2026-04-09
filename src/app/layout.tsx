import { Space_Grotesk, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable} ${lora.variable}`} style={{ backgroundColor: '#ffffff' }}>
      <head>
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="preload" href="/fonts/remixicon.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/remixicon.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
