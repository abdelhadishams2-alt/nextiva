import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import PostHogProvider from "@/components/providers/PostHogProvider";
// import ExitIntent from "@/components/ui/ExitIntent";

export async function generateMetadata() {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <PostHogProvider>
        {children}
        {/* <ExitIntent /> */}
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
