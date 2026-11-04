import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const b = useSiteSettings().settings.banner || {};
  const ka = lang === "ka";
  const badge = (ka ? b.badgeKa : b.badgeEn) || t.hero.badge;
  const title = (ka ? b.titleKa : b.titleEn) || t.hero.title;
  const cta = (ka ? b.ctaKa : b.ctaEn) || t.hero.cta;
  const link = b.ctaLink || "/#products";

  return (
    <section>
      <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[380px]">
        <img
          src={b.imageUrl || heroBanner}
          alt={title}
          className="w-full h-full object-cover"
          width={1024}
          height={512}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
          <span className="text-primary-foreground/90 text-lg md:text-xl font-medium mb-2">{badge}</span>
          <h1 className="text-primary-foreground text-2xl md:text-4xl font-bold mb-6 max-w-md leading-tight">{title}</h1>
          <Link to={link} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity w-fit">
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
