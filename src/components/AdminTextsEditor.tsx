import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { translations } from "@/i18n/translations";
import { flattenTexts, TextOverrides } from "@/i18n/textOverrides";

const SECTIONS: Record<string, string> = {
  nav: "მენიუ", hero: "ბანერი", categories: "კატეგორიები", products: "პროდუქტები", footer: "ფუტერი",
  productDetail: "პროდუქტის გვერდი", cart: "კალათა", auth: "შესვლა/რეგისტრაცია", account: "ანგარიში",
  checkout: "შეკვეთა და მიწოდების ფასი", about: "ჩვენ შესახებ", contact: "კონტაქტი", delivery: "მიწოდების გვერდი",
  returns: "დაბრუნების გვერდი", blog: "ბლოგი", wishlist: "სურვილების სია", chat: "ჩატი", quickBuy: "სწრაფი ყიდვა",
};

const input = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Props = { value: TextOverrides; onChange: (v: TextOverrides) => void };

const AdminTextsEditor = ({ value, onChange }: Props) => {
  const ka = useMemo(() => flattenTexts(translations.ka), []);
  const en = useMemo(() => flattenTexts(translations.en), []);
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");

  const keys = Object.keys(ka).filter((k) => {
    if (section !== "all" && !k.startsWith(section + ".")) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return [ka[k], en[k], value.ka?.[k], value.en?.[k]].some((x) => x?.toLowerCase().includes(needle));
  });

  const set = (lang: "ka" | "en", key: string, v: string) => {
    const next = { ...(value[lang] || {}) };
    if (v) next[key] = v; else delete next[key];
    onChange({ ...value, [lang]: next });
  };

  const edited = Object.keys(value.ka || {}).length + Object.keys(value.en || {}).length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        შეცვალეთ საიტზე არსებული ნებისმიერი წარწერა. ცარიელი ველი ნიშნავს, რომ ძველი ტექსტი რჩება. შეცვლილია: {edited}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input className={`${input} pl-8`} placeholder="მოძებნეთ ტექსტი, მაგ: უფასო" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${input} sm:w-56`} value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="all">ყველა განყოფილება</option>
          {Object.entries(SECTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {keys.length === 0 && <p className="text-sm text-muted-foreground">ვერაფერი მოიძებნა</p>}
        {keys.map((k) => {
          const changed = !!(value.ka?.[k] || value.en?.[k]);
          return (
            <div key={k} className={`rounded-lg border p-3 space-y-2 ${changed ? "border-primary" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{SECTIONS[k.split(".")[0]] || k.split(".")[0]}</span>
                {changed && (
                  <button type="button" className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-primary" onClick={() => onChange({ ka: { ...value.ka, [k]: "" }, en: { ...value.en, [k]: "" } })}>
                    <RotateCcw className="h-3 w-3" /> საწყისი
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <label className="text-xs space-y-1 min-w-0">
                  <span className="block text-muted-foreground truncate">KA: {ka[k]}</span>
                  <textarea rows={ka[k].length > 60 ? 3 : 1} className={input} value={value.ka?.[k] || ""} placeholder={ka[k]} onChange={(e) => set("ka", k, e.target.value)} />
                </label>
                <label className="text-xs space-y-1 min-w-0">
                  <span className="block text-muted-foreground truncate">EN: {en[k]}</span>
                  <textarea rows={(en[k] || "").length > 60 ? 3 : 1} className={input} value={value.en?.[k] || ""} placeholder={en[k]} onChange={(e) => set("en", k, e.target.value)} />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTextsEditor;
