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
  /* Only weight 500 is referenced (via --arizona-heading-weight). */
  weight: ["500"],
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable} ${lora.variable}`} style={{ backgroundColor: '#ffffff' }}>
      <head>
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" crossOrigin="anonymous" />
      </head>
      <body className="no-flash" suppressHydrationWarning>{children}</body>
    </html>
  );
}
