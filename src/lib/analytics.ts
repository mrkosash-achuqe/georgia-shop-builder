import { Product } from "@/data/products";
import type { Language } from "@/i18n/translations";

export type Lang = Language;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CURRENCY = "GEL";

export const isAnalyticsEnabled = () =>
  typeof window !== "undefined" && !!GA_ID;

const getGtag = () => (typeof window !== "undefined" ? window.gtag : undefined);

export const initAnalytics = () => {
  if (!isAnalyticsEnabled()) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: false });
};

const itemFromProduct = (product: Product, lang: Lang, quantity = 1) => ({
  item_id: product.id,
  item_name: lang === "ka" ? product.nameKa : product.nameEn,
  item_category: product.category,
  price: product.price,
  quantity,
});

export const trackPageView = (path: string) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
  });
};

export const trackViewItem = (product: Product, lang: Lang) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "view_item", {
    currency: CURRENCY,
    value: product.price,
    items: [itemFromProduct(product, lang)],
  });
};

export const trackAddToCart = (product: Product, lang: Lang, quantity = 1) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "add_to_cart", {
    currency: CURRENCY,
    value: product.price * quantity,
    items: [itemFromProduct(product, lang, quantity)],
  });
};

export const trackRemoveFromCart = (product: Product, lang: Lang, quantity = 1) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "remove_from_cart", {
    currency: CURRENCY,
    value: product.price * quantity,
    items: [itemFromProduct(product, lang, quantity)],
  });
};

export const trackBeginCheckout = (
  items: { product: Product; quantity: number }[],
  lang: Lang,
  value: number
) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "begin_checkout", {
    currency: CURRENCY,
    value,
    items: items.map((it) => itemFromProduct(it.product, lang, it.quantity)),
  });
};

export const trackPurchase = (
  transactionId: string,
  items: { product: Product; quantity: number }[],
  lang: Lang,
  value: number,
  shipping = 0,
  discount = 0
) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "purchase", {
    transaction_id: transactionId,
    value,
    currency: CURRENCY,
    shipping,
    discount,
    items: items.map((it) => itemFromProduct(it.product, lang, it.quantity)),
  });
};

export const trackAddToWishlist = (product: Product, lang: Lang) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "add_to_wishlist", {
    currency: CURRENCY,
    value: product.price,
    items: [itemFromProduct(product, lang)],
  });
};

export const trackRemoveFromWishlist = (product: Product, lang: Lang) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "remove_from_wishlist", {
    currency: CURRENCY,
    value: product.price,
    items: [itemFromProduct(product, lang)],
  });
};

export const trackSearch = (term: string) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "search", { search_term: term });
};

export const trackSignIn = (method: string) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "login", { method });
};

export const trackSignUp = (method: string) => {
  if (!isAnalyticsEnabled()) return;
  getGtag()?.("event", "sign_up", { method });
};
