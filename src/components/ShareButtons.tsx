import { useState } from "react";
import { Facebook, Link2, Check, Send, MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type ShareButtonsProps = {
  url: string;
  title: string;
};

const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const enc = encodeURIComponent;
  const links = [
    { key: "fb", label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: "wa", label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { key: "tg", label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">
        {lang === "ka" ? "გაზიარება:" : "Share:"}
      </span>
      {links.map(({ key, label, icon: Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={lang === "ka" ? "ბმულის კოპირება" : "Copy link"}
        title={lang === "ka" ? "ბმულის კოპირება" : "Copy link"}
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default ShareButtons;
