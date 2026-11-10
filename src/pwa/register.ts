/**
 * Guarded service-worker registration.
 * Refuses to register in dev, Lovable preview, iframes, or with `?sw=off`,
 * and unregisters any matching stale registration in those contexts.
 */
const SW_PATH = "/sw.js";

const shouldSkip = (): boolean => {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
};

const unregisterMatching = async () => {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => (r.active?.scriptURL || "").endsWith(SW_PATH))
      .map((r) => r.unregister()),
  );
};

export const registerPwa = () => {
  if (!("serviceWorker" in navigator)) return;
  if (shouldSkip()) {
    void unregisterMatching();
    return;
  }
  // When a newly published version takes over, reload once so the page runs it.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_PATH, { updateViaCache: "none" })
      .then((reg) => {
        void reg.update();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void reg.update();
        });
      })
      .catch(() => {
        /* ignore registration errors */
      });
  });
};