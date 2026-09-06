/**
 * Product code helper.
 * Uses the code entered by the admin when present, otherwise falls back to a
 * stable 6-digit code derived from the product id.
 */
export const generateSku = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String((hash % 900000) + 100000);
};

export const productSku = (product: { id: string; sku?: string | null }): string =>
  (product.sku || "").trim() || generateSku(product.id);
