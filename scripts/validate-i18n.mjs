#!/usr/bin/env node
// Validates i18n translations:
// 1. KA and EN trees have identical key structure
// 2. Every `t.x.y(.z)` usage in src/ resolves to an existing translation key
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const TRANSLATIONS_PATH = join(ROOT, "src/i18n/translations.ts");
const SRC_DIR = join(ROOT, "src");

// CLI args: --json[=path]   --quiet
const argv = process.argv.slice(2);
const quiet = argv.includes("--quiet");
const jsonArg = argv.find((a) => a === "--json" || a.startsWith("--json="));
const jsonOut = jsonArg
  ? (jsonArg.includes("=") ? jsonArg.split("=")[1] : "i18n-report.json")
  : null;

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

// --- Helpers for richer reporting ---
const IS_CI = !!process.env.GITHUB_ACTIONS;
const TRANSLATIONS_REL = "src/i18n/translations.ts";

// Build a map of leaf-key -> line number in translations.ts (KA side)
const translationsLines = readFileSync(TRANSLATIONS_PATH, "utf8").split("\n");
function findKeyLine(dottedKey) {
  const last = dottedKey.split(".").pop();
  const re = new RegExp(`(^|[^\\w])${last}\\s*:`);
  for (let i = 0; i < translationsLines.length; i++) {
    if (re.test(translationsLines[i])) return i + 1;
  }
  return null;
}

// Levenshtein for "did you mean" suggestions
function distance(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}
function suggest(usage, pool, max = 3) {
  return [...pool]
    .map((k) => ({ k, d: distance(usage, k) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .filter((x) => x.d <= Math.max(3, Math.floor(usage.length / 2)))
    .map((x) => x.k);
}

function ghAnnotation(level, file, line, message) {
  if (!IS_CI) return;
  const loc = file ? `file=${file.replace(/^\//, "")}${line ? `,line=${line}` : ""}` : "";
  console.log(`::${level} ${loc}::${message.replace(/\n/g, "%0A")}`);
}

// --- Report ---
const BOLD = "\x1b[1m", DIM = "\x1b[2m", RED = "\x1b[31m", YEL = "\x1b[33m",
      GRN = "\x1b[32m", CYN = "\x1b[36m", RST = "\x1b[0m";
const ok = (n) => (n === 0 ? `${GRN}✓${RST}` : `${RED}✗${RST}`);
const sectionHeader = (title) => console.log(`\n${BOLD}${title}${RST}`);

console.log(`${BOLD}=== i18n validation ===${RST}`);
console.log(`${DIM}translations: ${TRANSLATIONS_REL}${RST}`);
console.log(`${DIM}scanned files: ${srcFiles.length} | KA keys: ${kaKeys.size} | EN keys: ${enKeys.size}${RST}`);

// 1. Missing in EN (defined in KA, not in EN)
sectionHeader(`${ok(missingInEn.length)} Missing in EN  (${missingInEn.length})`);
if (missingInEn.length === 0) {
  console.log(`   ${DIM}— none —${RST}`);
} else {
  for (const key of missingInEn) {
    const line = findKeyLine(key);
    const loc = line ? `${TRANSLATIONS_REL}:${line}` : TRANSLATIONS_REL;
    console.log(`   ${RED}✗${RST} ${BOLD}${key}${RST}`);
    console.log(`       ${DIM}defined at:${RST} ${loc}`);
    console.log(`       ${YEL}fix:${RST} add "${key}" to translations.en`);
    ghAnnotation("error", TRANSLATIONS_REL, line,
      `i18n: key "${key}" is missing in EN translations`);
  }
}

// 2. Missing in KA (defined in EN, not in KA)
sectionHeader(`${ok(missingInKa.length)} Missing in KA  (${missingInKa.length})`);
if (missingInKa.length === 0) {
  console.log(`   ${DIM}— none —${RST}`);
} else {
  for (const key of missingInKa) {
    const line = findKeyLine(key);
    const loc = line ? `${TRANSLATIONS_REL}:${line}` : TRANSLATIONS_REL;
    console.log(`   ${RED}✗${RST} ${BOLD}${key}${RST}`);
    console.log(`       ${DIM}defined at:${RST} ${loc}`);
    console.log(`       ${YEL}fix:${RST} add "${key}" to translations.ka`);
    ghAnnotation("error", TRANSLATIONS_REL, line,
      `i18n: key "${key}" is missing in KA translations`);
  }
}

// 3. Invalid usages — show every location, suggestions, and code snippets
sectionHeader(`${ok(invalidUsages.length)} Invalid t.* usages  (${invalidUsages.length})`);
if (invalidUsages.length === 0) {
  console.log(`   ${DIM}— none —${RST}`);
} else {
  for (const { key, locs } of invalidUsages) {
    console.log(`   ${RED}✗${RST} ${BOLD}t.${key}${RST}  ${DIM}(${locs.length} usage${locs.length === 1 ? "" : "s"})${RST}`);
    const hints = suggest(key, allKeysArr);
    if (hints.length) {
      console.log(`       ${CYN}did you mean:${RST} ${hints.map((h) => `t.${h}`).join(", ")}`);
    }
    for (const l of locs) {
      const rel = l.file.replace(/^\//, "");
      console.log(`       ${DIM}↳${RST} ${rel}:${l.line}`);
      try {
        const snippet = readFileSync(join(ROOT, rel), "utf8").split("\n")[l.line - 1] || "";
        console.log(`           ${DIM}${snippet.trim().slice(0, 140)}${RST}`);
      } catch {}
      ghAnnotation("error", rel, l.line,
        `i18n: invalid translation key "t.${key}"` +
        (hints.length ? ` — did you mean ${hints.map((h) => `t.${h}`).join(", ")}?` : ""));
    }
  }
}

// 4. Unused keys (warning only)
sectionHeader(`${unusedKeys.length === 0 ? GRN + "✓" + RST : YEL + "•" + RST} Unused translation keys  (${unusedKeys.length})`);
if (unusedKeys.length === 0) {
  console.log(`   ${DIM}— none —${RST}`);
} else {
  for (const key of unusedKeys) {
    const line = findKeyLine(key);
    console.log(`   ${YEL}•${RST} ${key}  ${DIM}${line ? `(${TRANSLATIONS_REL}:${line})` : ""}${RST}`);
  }
}

// --- Summary ---
const errors = missingInEn.length + missingInKa.length + invalidUsages.length;
console.log(
  `\n${BOLD}Summary:${RST} ` +
  `missing-en=${missingInEn.length}  ` +
  `missing-ka=${missingInKa.length}  ` +
  `invalid-usages=${invalidUsages.length}  ` +
  `unused=${unusedKeys.length}`
);
console.log(
  errors === 0
    ? `${GRN}${BOLD}✓ All i18n checks passed${RST}`
    : `${RED}${BOLD}✗ ${errors} i18n error(s) found${RST}`
);
process.exit(errors === 0 ? 0 : 1);
