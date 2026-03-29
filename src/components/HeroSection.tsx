import { useLanguage } from "@/i18n/LanguageContext";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section>
      <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[380px]">
        <img
          src={heroBanner}
          alt="Handcrafted Georgian Products"
          className="w-full h-full object-cover"
          width={1024}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
          <span className="text-primary-foreground/90 text-lg md:text-xl font-medium mb-2">
            {t.hero.badge}
          </span>
          <h1 className="text-primary-foreground text-2xl md:text-4xl font-bold mb-6 max-w-md leading-tight">
            {t.hero.title}
          </h1>
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity w-fit">
            {t.hero.cta}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
