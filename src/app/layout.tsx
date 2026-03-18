import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable}`} style={{ backgroundColor: '#ffffff' }}>
      <head>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.woff2?t=1734404658139" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
