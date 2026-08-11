import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/hooks/useConsent";
import { useLanguage } from "@/i18n/LanguageContext";

interface ConsentBannerProps {
  /** unique storage key, e.g. "cookies" */
  consentKey?: string;
  title?: string;
  description?: string;
  acceptLabel?: string;
  declineLabel?: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const ConsentBanner = ({
  consentKey = "cookies",
  title,
  description,
  acceptLabel,
  declineLabel,
  learnMoreHref,
  learnMoreLabel,
  onAccept,
  onDecline,
}: ConsentBannerProps) => {
  const { lang } = useLanguage();
  const { consent, ready, accept, decline } = useConsent(consentKey);

  if (!ready || consent) return null;

  const copy =
    lang === "ka"
      ? {
          title: "ჩვენ ვიყენებთ ქუქებს",
          description:
            "ქუქები გვეხმარება საიტის მუშაობის გაუმჯობესებაში და შენთვის მორგებული შეთავაზებების ჩვენებაში.",
          accept: "თანხმობა",
          decline: "უარყოფა",
          learnMore: "დამატებით",
        }
      : {
          title: "We use cookies",
          description:
            "Cookies help us improve the site experience and show you more relevant products.",
          accept: "Accept",
          decline: "Decline",
          learnMore: "Learn more",
        };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto max-w-3xl rounded-xl border border-border bg-card shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-3 flex-1">
          <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title || copy.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {description || copy.description}{" "}
              {learnMoreHref && (
                <Link to={learnMoreHref} className="text-primary underline underline-offset-2">
                  {learnMoreLabel || copy.learnMore}
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              decline();
              onDecline?.();
            }}
          >
            <X className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{declineLabel || copy.decline}</span>
            <span className="sm:hidden sr-only">{declineLabel || copy.decline}</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => {
              accept();
              onAccept?.();
            }}
          >
            {acceptLabel || copy.accept}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;