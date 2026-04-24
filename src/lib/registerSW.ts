// Safe service-worker registration.
// NEVER registers inside Lovable's editor preview iframe — service workers
// there cause stale builds and broken navigation. Only runs in real
// production deployments (.lovable.app non-preview, custom domains, etc.).

import { toast } from "sonner";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLovablePreview =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.endsWith("lovable.dev");

export async function setupServiceWorker() {
  if (typeof window === "undefined") return;

  // Always clean up any leftover SW in unsupported contexts so the editor
  // preview doesn't keep serving stale cached pages from a previous session.
  if (isInIframe || isLovablePreview) {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      regs?.forEach((r) => r.unregister());
    } catch {
      /* ignore */
    }
    return;
  }

  if (!("serviceWorker" in navigator)) return;

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      immediate: true,
      onOfflineReady() {
        toast.success("অফলাইনে ব্যবহারের জন্য প্রস্তুত · Ready offline", {
          description: "Home and visited pages now load without internet.",
          duration: 4000,
        });
      },
      onNeedRefresh() {
        toast("নতুন সংস্করণ · New version available", {
          description: "Refreshing to load updates…",
          duration: 2500,
        });
        // Auto-update on next idle tick
        setTimeout(() => updateSW(true), 800);
      },
      onRegisterError(err) {
        // eslint-disable-next-line no-console
        console.warn("[PWA] SW registration failed:", err);
      },
    });
  } catch (err) {
    // virtual module unavailable in dev — safe to ignore
    // eslint-disable-next-line no-console
    console.debug("[PWA] virtual:pwa-register unavailable", err);
  }
}
