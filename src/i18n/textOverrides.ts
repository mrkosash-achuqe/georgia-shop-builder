export type TextOverrides = { ka?: Record<string, string>; en?: Record<string, string> };

/** Flattens string leaves of a translation object into "section.key" paths. */
export const flattenTexts = (obj: unknown, prefix = ""): Record<string, string> => {
  const out: Record<string, string> = {};
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out[path] = v;
      else if (v && typeof v === "object") Object.assign(out, flattenTexts(v, path));
    }
  }
  return out;
};

/** Returns a copy of base with non-empty overrides applied to existing string paths only. */
export const applyTextOverrides = <T>(base: T, overrides?: Record<string, string>): T => {
  if (!overrides || !Object.keys(overrides).length) return base;
  const copy = JSON.parse(JSON.stringify(base));
  for (const [path, value] of Object.entries(overrides)) {
    if (typeof value !== "string" || !value.trim()) continue;
    const parts = path.split(".");
    let node = copy;
    for (let i = 0; i < parts.length - 1 && node; i++) node = node[parts[i]];
    const last = parts[parts.length - 1];
    if (node && typeof node[last] === "string") node[last] = value;
  }
  return copy;
};
