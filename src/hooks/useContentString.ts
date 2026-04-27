import { usePublicAppConfig } from "./usePublicAppConfig";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Returns the admin-edited string for `key` in the current language,
 * falling back to the provided fallback if not set.
 */
export function useContentString(key: string, fallback?: string): string {
  const { contentItems } = usePublicAppConfig();
  const { language } = useLanguage();
  const item = contentItems[key];
  if (!item) return fallback ?? "";
  const v =
    language === "bn" ? item.bn :
    language === "ar" ? item.ar :
    item.en;
  return (v ?? fallback ?? "") as string;
}
