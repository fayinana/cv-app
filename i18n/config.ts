export const locales = ["en", "am", "om"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afan Oromo",
};

export const defaultLocale: Locale = "en";

export const COOKIE_NAME = "NEXT_LOCALE";
