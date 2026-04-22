import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import PostHogProvider from "@/components/providers/PostHogProvider";
import { ScrollReady } from "@/components/ui/ScrollReady";

const CookieConsent = dynamic(() => import("@/components/ui/CookieConsent"));

const CLIENT_NAMESPACES = [
  'Navbar', 'HeroShowcase', 'SplitShowcase',
  'EditorsPick', 'HowWeReview',
  'Footer', 'CookieConsent', 'Blogs', 'Error',
] as const;

function pickClientMessages(messages: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const ns of CLIENT_NAMESPACES) {
    if (messages[ns]) picked[ns] = messages[ns];
  }
  return picked;
}

export async function generateMetadata() {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const clientMessages = pickClientMessages(messages as Record<string, unknown>);

  return (
    <NextIntlClientProvider messages={clientMessages}>
      <PostHogProvider>
        <ScrollReady />
        {children}
        <CookieConsent />
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
