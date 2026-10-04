import { useEffect, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, Save } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminExtraNav from "@/components/AdminNav";
import AdminAiSettings from "@/components/AdminAiSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { DEFAULT_COLORS, FONT_PRESETS, SiteSettings, useSiteSettings } from "@/context/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/uploadImage";
import { toast } from "sonner";

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const AdminSettings = () => {
  const { isAdmin, checking } = useIsAdmin();
  const { settings, refresh } = useSiteSettings();
  const [s, setS] = useState<SiteSettings>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [botLoading, setBotLoading] = useState(true);
  const [botError, setBotError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setBotLoading(true);
    supabase.from("bot_settings").select("data").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      setBotError(error?.message || "");
      if (!error) setS({ ...settings, aiChat: { ...settings.aiChat, ...(data?.data as object || {}) } });
      setBotLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin, settings]);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setIn = <K extends "colors" | "banner" | "contact" | "announcement" | "pages" | "aiChat">(k: K, field: string, v: unknown) =>
    setS((p) => ({ ...p, [k]: { ...(p[k] as object || {}), [field]: v } }));

  const save = async () => {
    if (botLoading || botError) return;
    if (s.aiChat?.faqs?.some(f => !f.question.trim() || !f.answer.trim())) return toast.error("ყველა კითხვას დაუმატეთ პასუხი ან წაშალეთ ცარიელი ჩანაწერი");
    setSaving(true);
    const { error } = await supabase.rpc("save_site_settings", { _data: s as never });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("ცვლილებები შენახულია და საიტზე გამოჩნდა");
    refresh();
  };

  const upload = async (f: File | undefined, cb: (url: string) => void) => {
    if (!f) return;
    try { setUploading(true); cb(await uploadImage(f, "site")); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const Field = ({ label, value, onChange, area, placeholder }: { label: string; value?: string; onChange: (v: string) => void; area?: boolean; placeholder?: string }) => (
    <label className="block text-sm space-y-1">
      <span className="text-muted-foreground">{label}</span>
      {area
        ? <textarea rows={5} className={input} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className={input} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">წვდომა აკრძალულია</div>;

  const colors = { ...DEFAULT_COLORS, ...(s.colors || {}) };
  const colorLabels: Record<string, string> = { primary: "მთავარი (ღილაკები, აქცენტი)", background: "ფონი", foreground: "ტექსტი", card: "ბარათები" };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-4xl">
        <AdminExtraNav />
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-foreground">დიზაინი და პარამეტრები</h1>
          <Button onClick={save} disabled={saving || uploading || botLoading || !!botError}>{saving ? <Loader2 className="animate-spin" /> : <Save />} შენახვა</Button>
        </div>

        <Tabs defaultValue="design">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="design">დიზაინი</TabsTrigger>
            <TabsTrigger value="banner">ბანერი</TabsTrigger>
            <TabsTrigger value="contact">კონტაქტი</TabsTrigger>
            <TabsTrigger value="announce">განცხადება</TabsTrigger>
            <TabsTrigger value="pages">გვერდები</TabsTrigger>
            <TabsTrigger value="ai">AI კონსულტანტი</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="data-[state=inactive]:hidden bg-card border border-border rounded-xl p-4 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              {Field({ label: "მაღაზიის სახელი (ქართ.)", value: s.storeNameKa, onChange: (v) => set("storeNameKa", v), placeholder: "აჩუქე" })}
              {Field({ label: "Store name (English)", value: s.storeNameEn, onChange: (v) => set("storeNameEn", v), placeholder: "achuqe" })}
              {Field({ label: "ქვესათაური ლოგოს გვერდით", value: s.tagline, onChange: (v) => set("tagline", v), placeholder: "achuqe.com" })}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">ლოგო (თუ ატვირთავთ, სახელის ნაცვლად გამოჩნდება)</p>
              <div className="flex items-center gap-3">
                {s.logoUrl && <img src={s.logoUrl} alt="logo" className="h-12 max-w-[160px] object-contain border border-border rounded-md p-1 bg-background" />}
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-secondary">
                  <ImagePlus className="h-4 w-4" /> ატვირთვა
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], (u) => set("logoUrl", u))} />
                </label>
                {s.logoUrl && <button className="text-sm text-destructive" onClick={() => set("logoUrl", "")}>მოშორება</button>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">ფერები</p>
                <button className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-primary" onClick={() => set("colors", {})}><RotateCcw className="h-3 w-3" /> საწყისზე დაბრუნება</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(colorLabels) as (keyof typeof colors)[]).map((k) => (
                  <label key={k} className="text-xs space-y-1">
                    <span className="block text-muted-foreground">{colorLabels[k]}</span>
                    <input type="color" value={colors[k]} onChange={(e) => setIn("colors", k, e.target.value)} className="h-10 w-full rounded-md border border-border cursor-pointer" />
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm space-y-1">
              <span className="text-muted-foreground">შრიფტი</span>
              <select className={input} value={s.font || "noto-georgian"} onChange={(e) => set("font", e.target.value)}>
                {Object.entries(FONT_PRESETS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
              </select>
            </label>
            <p className="text-xs text-muted-foreground">მინიშნება: ფერები და შრიფტი მთელ საიტზე „შენახვის“ შემდეგ შეიცვლება.</p>
          </TabsContent>

          <TabsContent value="banner" className="data-[state=inactive]:hidden bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              {s.banner?.imageUrl && <img src={s.banner.imageUrl} alt="" className="h-20 w-36 object-cover rounded-md border border-border" />}
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-secondary">
                <ImagePlus className="h-4 w-4" /> ბანერის სურათი
                <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], (u) => setIn("banner", "imageUrl", u))} />
              </label>
              {s.banner?.imageUrl && <button className="text-sm text-destructive" onClick={() => setIn("banner", "imageUrl", "")}>მოშორება</button>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {Field({ label: "მცირე წარწერა (ქართ.)", value: s.banner?.badgeKa, onChange: (v) => setIn("banner", "badgeKa", v) })}
              {Field({ label: "Small text (EN)", value: s.banner?.badgeEn, onChange: (v) => setIn("banner", "badgeEn", v) })}
              {Field({ label: "სათაური (ქართ.)", value: s.banner?.titleKa, onChange: (v) => setIn("banner", "titleKa", v) })}
              {Field({ label: "Title (EN)", value: s.banner?.titleEn, onChange: (v) => setIn("banner", "titleEn", v) })}
              {Field({ label: "ღილაკის ტექსტი (ქართ.)", value: s.banner?.ctaKa, onChange: (v) => setIn("banner", "ctaKa", v) })}
              {Field({ label: "Button text (EN)", value: s.banner?.ctaEn, onChange: (v) => setIn("banner", "ctaEn", v) })}
              {Field({ label: "ღილაკის ბმული", value: s.banner?.ctaLink, onChange: (v) => setIn("banner", "ctaLink", v), placeholder: "/#products" })}
            </div>
            <p className="text-xs text-muted-foreground">ცარიელი ველები ძველ ტექსტს დატოვებს.</p>
          </TabsContent>

          <TabsContent value="contact" className="data-[state=inactive]:hidden bg-card border border-border rounded-xl p-4 grid sm:grid-cols-2 gap-3">
            {Field({ label: "ტელეფონი", value: s.contact?.phone, onChange: (v) => setIn("contact", "phone", v) })}
            {Field({ label: "ელ-ფოსტა", value: s.contact?.email, onChange: (v) => setIn("contact", "email", v) })}
            {Field({ label: "მისამართი (ქართ.)", value: s.contact?.addressKa, onChange: (v) => setIn("contact", "addressKa", v) })}
            {Field({ label: "Address (EN)", value: s.contact?.addressEn, onChange: (v) => setIn("contact", "addressEn", v) })}
            {Field({ label: "Facebook ბმული", value: s.contact?.facebook, onChange: (v) => setIn("contact", "facebook", v), placeholder: "https://facebook.com/..." })}
            {Field({ label: "Instagram ბმული", value: s.contact?.instagram, onChange: (v) => setIn("contact", "instagram", v) })}
            {Field({ label: "TikTok ბმული", value: s.contact?.tiktok, onChange: (v) => setIn("contact", "tiktok", v) })}
            {Field({ label: "YouTube ბმული", value: s.contact?.youtube, onChange: (v) => setIn("contact", "youtube", v) })}
          </TabsContent>

          <TabsContent value="announce" className="data-[state=inactive]:hidden bg-card border border-border rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!s.announcement?.enabled} onChange={(e) => setIn("announcement", "enabled", e.target.checked)} /> ზოლის ჩართვა საიტის თავში
            </label>
            {Field({ label: "ტექსტი (ქართ.)", value: s.announcement?.textKa, onChange: (v) => setIn("announcement", "textKa", v), placeholder: "-20% ფასდაკლება ყველა საათზე!" })}
            {Field({ label: "Text (EN)", value: s.announcement?.textEn, onChange: (v) => setIn("announcement", "textEn", v) })}
            {Field({ label: "ბმული (არასავალდებულო)", value: s.announcement?.link, onChange: (v) => setIn("announcement", "link", v), placeholder: "/?category=clocks#products" })}
          </TabsContent>

          <TabsContent value="pages" className="data-[state=inactive]:hidden bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">აქ დაწერილი ტექსტი გამოჩნდება შესაბამისი გვერდის თავში. ცარიელის შემთხვევაში დარჩება არსებული ტექსტი.</p>
            {Field({ label: "ჩვენ შესახებ (ქართ.)", value: s.pages?.aboutKa, onChange: (v) => setIn("pages", "aboutKa", v), area: true })}
            {Field({ label: "About us (EN)", value: s.pages?.aboutEn, onChange: (v) => setIn("pages", "aboutEn", v), area: true })}
            {Field({ label: "მიწოდება (ქართ.)", value: s.pages?.deliveryKa, onChange: (v) => setIn("pages", "deliveryKa", v), area: true })}
            {Field({ label: "Delivery (EN)", value: s.pages?.deliveryEn, onChange: (v) => setIn("pages", "deliveryEn", v), area: true })}
            {Field({ label: "დაბრუნება (ქართ.)", value: s.pages?.returnsKa, onChange: (v) => setIn("pages", "returnsKa", v), area: true })}
            {Field({ label: "Returns (EN)", value: s.pages?.returnsEn, onChange: (v) => setIn("pages", "returnsEn", v), area: true })}
          </TabsContent>

          <TabsContent value="ai" className="data-[state=inactive]:hidden">
            {botError ? <p role="alert" className="text-destructive">{botError}</p> : botLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AdminAiSettings value={s.aiChat || {}} onChange={v => set("aiChat", v)} />}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSettings;
