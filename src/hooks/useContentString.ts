import { usePublicAppConfig } from "./usePublicAppConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserCountry } from "./useUserCountry";

/**
 * Returns the admin-edited string for `key` in the current language.
 * Resolution order:
 *   1. Country-specific locale override (contentLocales[key][lang][country])
 *   2. Wildcard locale override (contentLocales[key][lang]['*'])
 *   3. Base contentItems[key][lang]
 *   4. Provided fallback
 */
export function useContentString(key: string, fallback?: string): string {
  const { contentItems, contentLocales } = usePublicAppConfig();
  const { language } = useLanguage();
  const { country } = useUserCountry();

  const langLocales = contentLocales[key]?.[language];
  if (langLocales) {
    if (country && langLocales[country]) return langLocales[country];
    if (langLocales["*"]) return langLocales["*"];
  }

  const item = contentItems[key];
  if (item) {
    const v =
      language === "bn" ? item.bn :
      language === "ar" ? item.ar :
      item.en;
    if (v) return v;
  }
  return fallback ?? "";
}
