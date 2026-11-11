import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Trash2, Paperclip, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { photoError } from "@/lib/chatPhoto";
import { Progress } from "@/components/ui/progress";

export default function SupportChat() {
  const { lang, t } = useLanguage();
  const { settings, loading } = useSiteSettings();
  const ai = settings.aiChat;
  const c = t.chat;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const [photo, setPhoto] = useState<{ url: string; filename: string; mediaType: string } | null>(null);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoFailure, setPhotoFailure] = useState("");
  const removePhoto = () => { readerRef.current?.abort(); readerRef.current = null; setPhoto(null); setPhotoProgress(null); setPhotoFailure(""); };
  useEffect(() => () => readerRef.current?.abort(), []);
  const choosePhoto = (file?: File) => {
    if (!file) return;
    removePhoto();
    const invalid = photoError(file);
    if (invalid) { setPhotoFailure(lang === "ka" ? (invalid === "type" ? "აირჩიეთ JPG, PNG ან WEBP ფოტო." : "ფოტოს ზომა უნდა იყოს 5 MB-მდე.") : (invalid === "type" ? "Choose a JPG, PNG or WEBP photo." : "Photo must be no larger than 5 MB.")); return; }
    const reader = new FileReader();
    readerRef.current = reader;
    setPhotoProgress(0);
    reader.onprogress = e => { if (e.lengthComputable) setPhotoProgress(Math.round(e.loaded / e.total * 100)); };
    reader.onerror = () => { setPhotoProgress(null); setPhotoFailure(lang === "ka" ? "ფოტოს წაკითხვა ვერ მოხერხდა. სცადეთ თავიდან." : "Could not read the photo. Please try again."); };
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const url = reader.result;
      const image = new Image();
      image.onload = () => { if (readerRef.current !== reader) return; setPhoto({ url, filename: file.name, mediaType: file.type }); setPhotoProgress(null); };
      image.onerror = () => { if (readerRef.current !== reader) return; setPhotoProgress(null); setPhotoFailure(lang === "ka" ? "ფოტო დაზიანებულია ან ვერ იხსნება." : "Photo is damaged or cannot be opened."); };
      image.src = url;
    };
    reader.readAsDataURL(file);
  };
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
    body: { lang },
    headers: async () => {
      const { data } = await supabase.auth.getSession();
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      return { apikey: key, Authorization: `Bearer ${data.session?.access_token || key}` };
    },
  }), [lang]);
  const { messages, sendMessage, status, error, setMessages, stop, clearError } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const greeting = (lang === "en" ? ai?.greetingEn : ai?.greetingKa)?.trim() || c.greeting;
  const title = (lang === "en" ? ai?.titleEn : ai?.titleKa)?.trim() || c.title;
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);
  useEffect(() => { if (ai?.enabled === false) { stop(); setOpen(false); } }, [ai?.enabled, stop]);
  const send = (text: string) => {
    if ((!text.trim() && !photo) || busy || photoProgress !== null) return;
    clearError();
    setPhotoFailure("");
    setInput("");
    void sendMessage({ text: text.trim(), ...(photo ? { files: [{ type: "file" as const, ...photo }] } : {}) });
    setPhoto(null);
    inputRef.current?.focus();
  };
  if (loading || ai?.enabled === false) return null;
  return <>
    {!open && <Button onClick={() => setOpen(true)} aria-label={c.open} className="fixed bottom-5 right-5 z-50 rounded-full h-auto px-4 py-3 shadow-lg"><MessageCircle className="h-5 w-5" /><span className="hidden sm:inline">{ai?.assistantName?.trim() || c.open}</span></Button>}
    {open && <div role="dialog" aria-label={title} className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(600px,75dvh)] flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-3 bg-primary text-primary-foreground">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-foreground/30 font-bold" aria-hidden="true">{(ai?.assistantName || settings.storeNameKa || "ა").slice(0,1)}</span>
        <div className="flex-1 min-w-0"><div className="text-sm font-semibold break-words">{title}</div><div className="text-xs break-words">{ai?.assistantName || c.subtitle}</div></div>
        <Button variant="ghost" size="icon-sm" disabled={busy} title={c.clear} aria-label={c.clear} onClick={() => { setMessages([]); clearError(); removePhoto(); }} className="shrink-0 hover:bg-primary-foreground/10 hover:text-primary-foreground"><Trash2 /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setOpen(false)} className="shrink-0 hover:bg-primary-foreground/10 hover:text-primary-foreground"><X /></Button>
      </div>
      <Conversation className="min-h-0"><ConversationContent className="gap-4 p-4">
        <Message from="assistant"><MessageContent><MessageResponse>{greeting}</MessageResponse></MessageContent></Message>
        {messages.map(m => <Message key={m.id} from={m.role}><MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : ""}>{m.parts.map((part,i) => part.type === "file" && part.mediaType.startsWith("image/") ? <img key={i} src={part.url} alt={part.filename || (lang === "ka" ? "გაგზავნილი ფოტო" : "Sent photo")} className="max-w-full w-56 max-h-56 object-contain rounded-md" /> : part.type === "text" ? <MessageResponse key={i}>{part.text}</MessageResponse> : part.type === "reasoning" && status === "streaming" && m.id === messages.at(-1)?.id ? <span key={i} className="text-xs text-muted-foreground">{lang === "ka" ? "ვფიქრობ…" : "Thinking…"}</span> : null)}</MessageContent></Message>)}
        {status === "submitted" && <Shimmer>{lang === "ka" ? "ვფიქრობ…" : "Thinking…"}</Shimmer>}
        {error && <p role="alert" className="text-sm text-destructive break-words">{error.message || c.error}</p>}
        {messages.length === 0 && <div className="flex flex-col gap-2">{(ai?.suggestions || []).map((q,i) => { const text = lang === "en" ? q.en : q.ka; return text.trim() ? <Button key={i} variant="outline" className="h-auto whitespace-normal text-left justify-start py-2" onClick={() => send(text)}>{text}</Button> : null; })}</div>}
      </ConversationContent><ConversationScrollButton /></Conversation>
      <div className="p-3 border-t border-border shrink-0">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label={lang === "ka" ? "ფოტოს არჩევა" : "Choose photo"} className="hidden" onChange={e => { choosePhoto(e.target.files?.[0]); e.target.value = ""; }} />
        {photo && <div className="flex items-center gap-2 mb-2"><img src={photo.url} alt={lang === "ka" ? "ფოტოს წინასწარი ნახვა" : "Photo preview"} className="w-16 h-16 object-contain rounded-md bg-muted" /><span className="text-xs min-w-0 flex-1 break-all line-clamp-2">{photo.filename}</span><Button type="button" variant="ghost" size="icon" aria-label={lang === "ka" ? "ფოტოს წაშლა" : "Remove photo"} title={lang === "ka" ? "ფოტოს წაშლა" : "Remove photo"} onClick={removePhoto}><X className="w-4 h-4" /></Button></div>}
        {photoProgress !== null && <div role="status" className="space-y-1 mb-2"><p className="text-xs text-muted-foreground">{lang === "ka" ? "ფოტო იტვირთება" : "Loading photo"} {photoProgress}%</p><Progress value={photoProgress} /></div>}
        {status === "submitted" && messages.at(-1)?.parts.some(p => p.type === "file") && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" />{lang === "ka" ? "ფოტო იგზავნება…" : "Sending photo…"}</p>}
        {photoFailure && <p role="alert" className="text-sm text-destructive mb-2">{photoFailure}</p>}
        <PromptInput onSubmit={({ text }) => send(text)}><PromptInputTextarea ref={inputRef} autoFocus aria-label={c.placeholder} placeholder={c.placeholder} value={input} maxLength={4000} onChange={e => setInput(e.target.value)} className="min-h-16 max-h-32" /><PromptInputFooter className="justify-between"><Button type="button" size="icon" variant="ghost" disabled={busy || photoProgress !== null} title={lang === "ka" ? "ფოტოს მიმაგრება" : "Attach photo"} aria-label={lang === "ka" ? "ფოტოს მიმაგრება" : "Attach photo"} onClick={() => fileRef.current?.click()}><Paperclip className="h-5 w-5" /></Button><PromptInputSubmit status={status} onStop={stop} disabled={!busy && ((!input.trim() && !photo) || photoProgress !== null)} aria-label={busy ? (lang === "ka" ? "შეჩერება" : "Stop") : c.send} /></PromptInputFooter></PromptInput>
      </div>
    </div>}
  </>;
}