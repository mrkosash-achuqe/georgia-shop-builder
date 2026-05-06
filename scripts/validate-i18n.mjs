#!/usr/bin/env node
// Validates i18n translations:
// 1. KA and EN trees have identical key structure
// 2. Every `t.x.y(.z)` usage in src/ resolves to an existing translation key
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const TRANSLATIONS_PATH = join(ROOT, "src/i18n/translations.ts");
const SRC_DIR = join(ROOT, "src");

// --- Load translations by stripping TS and evaluating ---
const tsSrc = readFileSync(TRANSLATIONS_PATH, "utf8");
const jsSrc = tsSrc
  .replace(/export type[\s\S]*?;\n/g, "")
  .replace(/export const translations =/, "const translations =")
  .replace(/ as const;?\s*$/, ";")
  + "\nexport default translations;";
const dataUrl = "data:text/javascript;base64," + Buffer.from(jsSrc).toString("base64");
const { default: translations } = await import(dataUrl);

// --- Collect all dotted key paths from a tree ---
function collectKeys(obj, prefix = "") {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const sub of collectKeys(v, path)) keys.add(sub);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

const kaKeys = collectKeys(translations.ka);
const enKeys = collectKeys(translations.en);

const missingInEn = [...kaKeys].filter((k) => !enKeys.has(k)).sort();
const missingInKa = [...enKeys].filter((k) => !kaKeys.has(k)).sort();

// --- Walk src/ and collect t.* usages ---
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if ([".ts", ".tsx"].includes(extname(p))) files.push(p);
  }
  return files;
}

const srcFiles = walk(SRC_DIR);
// Match `t.foo.bar` and `t.foo.bar.baz` (identifier chains)
const usageRegex = /\bt\.([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g;
const usages = new Map(); // key -> [{file, line}]
for (const file of srcFiles) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((lineText, i) => {
    let m;
    const re = new RegExp(usageRegex.source, "g");
    while ((m = re.exec(lineText)) !== null) {
      const key = m[1];
      if (!usages.has(key)) usages.set(key, []);
      usages.get(key).push({ file: file.replace(ROOT, ""), line: i + 1 });
    }
  });
}

// A usage is valid if it's an exact leaf, OR a prefix of a leaf (object access like t.cart),
// OR a leaf followed by chain like t.categories.items[0] -> usage captured as "categories.items"
const allKeys = kaKeys; // structural source of truth
const allKeysArr = [...allKeys];
function isValidUsage(usage) {
  if (allKeys.has(usage)) return true;
  // prefix of some leaf?
  const prefix = usage + ".";
  if (allKeysArr.some((k) => k.startsWith(prefix))) return true;
  // any ancestor is a leaf? (e.g. t.categories.items.map -> categories.items is a leaf array)
  const parts = usage.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    if (allKeys.has(parts.slice(0, i).join("."))) return true;
  }
  return false;
}

const invalidUsages = [];
for (const [key, locs] of usages) {
  if (!isValidUsage(key)) invalidUsages.push({ key, locs });
}

// --- Unused leaf keys (no usage references them, even via prefix) ---
const usageKeys = [...usages.keys()];
const unusedKeys = [];
for (const leaf of allKeysArr) {
  const hit = usageKeys.some(
    (u) => u === leaf || leaf.startsWith(u + ".") || u.startsWith(leaf + ".")
  );
  if (!hit) unusedKeys.push(leaf);
}

// --- Report ---
const c = (n) => (n === 0 ? "✓" : "✗");
console.log("=== i18n validation ===\n");

console.log(`${c(missingInEn.length)} Keys in KA but missing in EN: ${missingInEn.length}`);
missingInEn.forEach((k) => console.log("   - " + k));

console.log(`\n${c(missingInKa.length)} Keys in EN but missing in KA: ${missingInKa.length}`);
missingInKa.forEach((k) => console.log("   - " + k));

console.log(`\n${c(invalidUsages.length)} Invalid t.* usages: ${invalidUsages.length}`);
invalidUsages.forEach(({ key, locs }) => {
  console.log(`   - t.${key}`);
  locs.slice(0, 3).forEach((l) => console.log(`       ${l.file}:${l.line}`));
});

console.log(`\n• Unused translation keys: ${unusedKeys.length}`);
unusedKeys.forEach((k) => console.log("   - " + k));

const errors = missingInEn.length + missingInKa.length + invalidUsages.length;
console.log(`\n${errors === 0 ? "✓ All checks passed" : `✗ ${errors} error(s) found`}`);
process.exit(errors === 0 ? 0 : 1);
