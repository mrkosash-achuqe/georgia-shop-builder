import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { AiChatSettings } from "@/context/SiteSettingsContext";

export default function AdminAiSettings({ value, onChange }: { value: AiChatSettings; onChange: (v: AiChatSettings) => void }) {
  const set = <K extends keyof AiChatSettings>(key: K, v: AiChatSettings[K]) => onChange({ ...value, [key]: v });
  const field = (label: string, key: "assistantName" | "titleKa" | "titleEn" | "greetingKa" | "greetingEn" | "systemPrompt" | "businessInfo" | "restrictions", multiline = false) => (
    <label className="block space-y-2 text-sm"><span>{label}</span>{multiline
      ? <Textarea rows={5} value={value[key] || ""} onChange={e => set(key, e.target.value)} maxLength={12000} />
      : <Input value={value[key] || ""} onChange={e => set(key, e.target.value)} maxLength={500} />}</label>
  );
  const faqs = value.faqs || [];
  const suggestions = value.suggestions || [];
  return <div className="space-y-7 py-4">
    <label className="flex items-center justify-between gap-4 border-b border-border pb-5 font-medium"><span>AI ასისტენტის ჩართვა საიტზე</span><Switch checked={value.enabled !== false} onCheckedChange={v => set("enabled", v)} /></label>
    <section className="space-y-4"><h2 className="font-semibold">სახელი და მისალმება</h2>
      {field("ასისტენტის სახელი", "assistantName")}
      <div className="grid gap-4 sm:grid-cols-2">{field("ჩატის სათაური (ქართ.)", "titleKa")}{field("Chat title (EN)", "titleEn")}{field("მისალმება (ქართ.)", "greetingKa")}{field("Greeting (EN)", "greetingEn")}</div>
    </section>
    <section className="space-y-4 border-t border-border pt-5"><h2 className="font-semibold">პასუხის სტილი</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm"><span className="block">ტონი</span><select className="w-full rounded-md border border-input bg-background p-2" value={value.tone || "friendly"} onChange={e => set("tone", e.target.value as AiChatSettings["tone"])}><option value="friendly">მეგობრული</option><option value="formal">ოფიციალური</option><option value="enthusiastic">ენთუზიასტური</option></select></label>
        <label className="space-y-2 text-sm"><span className="block">პასუხის სიგრძე</span><select className="w-full rounded-md border border-input bg-background p-2" value={value.responseLength || "short"} onChange={e => set("responseLength", e.target.value as AiChatSettings["responseLength"])}><option value="short">მოკლე</option><option value="balanced">საშუალო</option><option value="detailed">დეტალური</option></select></label>
      </div>{field("ინსტრუქცია ასისტენტისთვის (System Prompt)", "systemPrompt", true)}
    </section>
    <section className="space-y-4 border-t border-border pt-5"><h2 className="font-semibold">მაღაზიის ინფორმაცია და წესები</h2>
      {field("მიწოდება, ვადები, დაბრუნება, გადახდა და კონტაქტი", "businessInfo", true)}
      <label className="flex items-center justify-between gap-4 text-sm"><span>შესთავაზოს მხოლოდ მარაგში არსებული პროდუქტები</span><Switch checked={value.restrictToStock !== false} onCheckedChange={v => set("restrictToStock", v)} /></label>
      <label className="flex items-center justify-between gap-4 text-sm"><span>დამატებითი შეზღუდვები</span><Switch checked={!!value.restrictionsEnabled} onCheckedChange={v => set("restrictionsEnabled", v)} /></label>
      {value.restrictionsEnabled && field("აკრძალული თემები და ქცევები", "restrictions", true)}
    </section>
    <section className="space-y-4 border-t border-border pt-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">საკუთარი კითხვა-პასუხები</h2><Button variant="outline" size="sm" disabled={faqs.length >= 30} onClick={() => set("faqs", [...faqs, { question: "", answer: "" }])}><Plus className="h-4 w-4" /> დამატება</Button></div>
      {faqs.map((faq, i) => <div key={i} className="space-y-3 border-b border-border pb-4"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">კითხვა-პასუხი {i + 1}</span><Button variant="ghost" size="icon" aria-label={`კითხვა-პასუხის წაშლა ${i + 1}`} onClick={() => set("faqs", faqs.filter((_, j) => i !== j))}><Trash2 className="h-4 w-4" /></Button></div><Input aria-label={`კითხვა ${i + 1}`} placeholder="კითხვა" value={faq.question} maxLength={500} onChange={e => set("faqs", faqs.map((f,j) => j === i ? { ...f, question: e.target.value } : f))} /><Textarea aria-label={`პასუხი ${i + 1}`} placeholder="პასუხი" value={faq.answer} maxLength={2000} onChange={e => set("faqs", faqs.map((f,j) => j === i ? { ...f, answer: e.target.value } : f))} /></div>)}
    </section>
    <section className="space-y-4 border-t border-border pt-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">ჩატში საწყისი კითხვები</h2><Button variant="outline" size="sm" disabled={suggestions.length >= 6} onClick={() => set("suggestions", [...suggestions, { ka: "", en: "" }])}><Plus className="h-4 w-4" /> დამატება</Button></div>
      {suggestions.map((item,i) => <div key={i} className="flex gap-2 items-start"><div className="grid sm:grid-cols-2 gap-2 flex-1"><Input aria-label={`საწყისი კითხვა ქართ. ${i+1}`} placeholder="კითხვა (ქართ.)" value={item.ka} maxLength={200} onChange={e => set("suggestions", suggestions.map((f,j) => i===j ? {...f,ka:e.target.value}:f))} /><Input aria-label={`Starter question EN ${i+1}`} placeholder="Question (EN)" value={item.en} maxLength={200} onChange={e => set("suggestions", suggestions.map((f,j) => i===j ? {...f,en:e.target.value}:f))} /></div><Button variant="ghost" size="icon" aria-label={`საწყისი კითხვის წაშლა ${i+1}`} onClick={() => set("suggestions", suggestions.filter((_,j) => i!==j))}><Trash2 className="h-4 w-4" /></Button></div>)}
    </section>
  </div>;
}