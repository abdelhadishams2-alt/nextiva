# Layouts

## Root Layout (src/app/layout.tsx)
- Loads fonts: Space Grotesk, Geist Mono, Lora via next/font/google
- Sets font CSS variables on html element
- Body has `no-flash` class (hidden until hydrated)

## Locale Layout (src/app/[locale]/layout.tsx)
- NextIntlClientProvider with filtered client namespaces
- PostHogProvider for analytics
- ScrollReady component (adds `is-ready` class)
- Dynamic CookieConsent component
