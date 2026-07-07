import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const SITE_URL = "https://achuqe.com";

type SEOProps = {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * SEO helper — sets per-route <title>, description, canonical, hreflang
 * (ka / en / x-default) and OpenGraph tags. Canonical strips any `lang`
 * query param; alternates re-add `?lang=ka` / `?lang=en`.
 */
const SEO = ({ title, description, image, type = "website", jsonLd }: SEOProps) => {
  const { lang } = useLanguage();
  const { pathname, search } = useLocation();

  const params = new URLSearchParams(search);
  params.delete("lang");
  const cleanQuery = params.toString();
  const basePath = `${pathname}${cleanQuery ? `?${cleanQuery}` : ""}`;
  const canonical = `${SITE_URL}${basePath}`;
  const sep = cleanQuery ? "&" : "?";
  const kaHref = `${SITE_URL}${basePath}${sep}lang=ka`;
  const enHref = `${SITE_URL}${basePath}${sep}lang=en`;

  const ogLocale = lang === "en" ? "en_US" : "ka_GE";
  const altLocale = lang === "en" ? "ka_GE" : "en_US";

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="ka" href={kaHref} />
      <link rel="alternate" hrefLang="en" href={enHref} />
      <link rel="alternate" hrefLang="x-default" href={kaHref} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={altLocale} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;