import { useEffect, useState } from "react";
import { usePublicAppConfig } from "./usePublicAppConfig";

const KEY = "user_country";

function detect(): string | null {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored.toLowerCase();
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    if (!lang) return null;
    const parts = lang.split("-");
    if (parts.length >= 2) return parts[1].toLowerCase();
    return null;
  } catch {
    return null;
  }
}

/**
 * Detected from the browser locale (e.g. "bn-BD" → "bd"), persisted to
 * localStorage. Admin can set a project-wide default in `app_branding.default_country`.
 */
export function useUserCountry() {
  const { branding } = usePublicAppConfig();
  const [country, setCountryState] = useState<string | null>(detect());

  useEffect(() => {
    const onChange = () => setCountryState(detect());
    window.addEventListener("user-country-changed", onChange);
    return () => window.removeEventListener("user-country-changed", onChange);
  }, []);

  const effective =
    country ?? (branding?.default_country ? String(branding.default_country).toLowerCase() : null);

  const setCountry = (c: string | null) => {
    try {
      if (c) localStorage.setItem(KEY, c.toLowerCase());
      else localStorage.removeItem(KEY);
    } catch {/* ignore */}
    setCountryState(c ? c.toLowerCase() : null);
    window.dispatchEvent(new Event("user-country-changed"));
  };

  return { country: effective, rawCountry: country, setCountry };
}

export const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: "bd", name: "Bangladesh" },
  { code: "in", name: "India" },
  { code: "pk", name: "Pakistan" },
  { code: "us", name: "United States" },
  { code: "gb", name: "United Kingdom" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "my", name: "Malaysia" },
  { code: "id", name: "Indonesia" },
  { code: "eg", name: "Egypt" },
  { code: "tr", name: "Turkey" },
];
