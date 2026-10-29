import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Headphones, RotateCcw, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct, StoreSettings } from "@/lib/queries";
import { productImage } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { resolveStoreName } from "@/lib/store-name";
import {
  DEFAULT_TRUST_BAR_BG_COLOR,
  DEFAULT_TRUST_BAR_ICON_BG_COLOR,
  DEFAULT_TRUST_BAR_ICON_COLOR,
} from "@/lib/store-settings";

/**
 * Storefront hero.
 *
 * Photography sells clothing, so the visual is the shop's own products: three
 * portrait photos in a staggered row, each a link to that product. Portrait
 * crops on purpose; the catalogue is shot 4:5, and a landscape frame cut the
 * model's head off.
 *
 * The headline is interface copy in the buyer's language. The owner's tagline
 * is written in one language, so it is shown only to readers of that language
 * (Arabic, the default) instead of greeting an English reader in Arabic.
 */
export function HomeHero({
  settings,
  products,
}: {
  settings: StoreSettings | null;
  products: CatalogueProduct[];
}) {
  const { t, locale } = useI18n();
  const shots = products
    .map((product) => ({ product, image: productImage(product) }))
    .filter((shot): shot is { product: CatalogueProduct; image: string } => shot.image !== null)
    .slice(0, 3);
  const tagline = settings?.tagline?.trim();
  const localizedTagline = locale === "ar" ? tagline : settings?.tagline_fr?.trim();
  const mobileHeroImage = settings?.hero_mobile_url ?? "/8k.jpg";
  const desktopHeroImage = settings?.hero_desktop_url ?? "/hd.jpg";
  const heroBackgroundStyle: React.CSSProperties & {
    "--hero-background-image-mobile": string;
    "--hero-background-image-desktop": string;
  } = {
    backgroundImage: `
      linear-gradient(rgba(231, 223, 223, 0.20), rgba(72, 28, 28, 0.4)),
      var(--hero-background-image, url('/home3.jpg'))
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    "--hero-background-image-mobile": `url("${mobileHeroImage}")`,
    "--hero-background-image-desktop": `url("${desktopHeroImage}")`,
  };

  return (
    <section
      className="home-hero-background overflow-hidden  border-bottom"
      style={heroBackgroundStyle}
    >
      <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20">
        <div className="flex flex-col items-start">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-outline bg-[#fff]/20  px-3.5 py-1.5 text-xs font-semibold text-secondary">
            <span className="size-[7px] shrink-0 rounded-full bg-secondary" aria-hidden="true" />
            {resolveStoreName(settings?.name)}
          </span>

          <h1 className="mb-4 max-w-xl font-display text-[clamp(32px,5.2vw,60px)] font-semibold leading-[1.06] tracking-[-0.02em]">
            <span
              style={
                localizedTagline && settings?.tagline_color
                  ? { color: settings.tagline_color }
                  : undefined
              }
            >
              {localizedTagline || t("home.hero.title")}
            </span>
          </h1>

          <p className="mb-7 max-w-[480px] text-base leading-[1.7] text-white text-on-surface-muted">
            {t("home.hero.body")}
          </p>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link to="/catalogue" className="btn btn-primary btn-lg flex-1 sm:flex-none">
              {t("home.promo.cta")}
              <ArrowRight size={18} className="rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg flex-1 sm:flex-none">
              {t("nav.trackOrder")}
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-muted">
            <li className="inline-flex items-center gap-1.5">
              <Banknote size={15} className="text-primary" aria-hidden="true" />
              {t("home.trust.cod.title")}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RotateCcw size={15} className="text-primary" aria-hidden="true" />
              {t("home.trust.returns.title", { days: settings?.returns_days ?? 14 })}
            </li>
          </ul>
        </div>

        {shots.length > 0 && (
          <div className="grid grid-cols-3 items-start gap-3 sm:gap-4">
            {shots.map(({ product, image }, index) => {
              const name = localized(locale, product.name, product.name_fr);
              return (
                <Link
                  key={product.id}
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  className={cn(
                    "group relative block overflow-hidden rounded-[18px]  bg-transparent shadow-xl",
                    index === 1 && "mt-8 sm:mt-12",
                  )}
                >
                  <img
                    src={image}
                    alt={name}
                    // The first photo is the largest paint above the fold.
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/65 to-transparent px-3 pt-8 pb-3 text-xs font-medium text-white sm:block">
                    <span className="line-clamp-1">{name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Trust bar — infinite right-to-left marquee.
 *
 * Every claim here is one the platform actually keeps: cash on delivery is the
 * only payment method, coverage is all 58 wilayas, and the return window is a
 * real setting. Nothing is decorative marketing copy.
 */
export function TrustBar({
  returnsDays,
  backgroundColor,
  iconColor,
  iconBackgroundColor,
}: {
  returnsDays: number;
  backgroundColor: string | null | undefined;
  iconColor: string | null | undefined;
  iconBackgroundColor: string | null | undefined;
}) {
  const { t } = useI18n();
  const barColor = backgroundColor ?? DEFAULT_TRUST_BAR_BG_COLOR;
  const trustIconColor = iconColor ?? DEFAULT_TRUST_BAR_ICON_COLOR;
  const trustIconBackgroundColor = iconBackgroundColor ?? DEFAULT_TRUST_BAR_ICON_BG_COLOR;

  const items = [
    { icon: Banknote, title: t("home.trust.cod.title") },
    { icon: Truck, title: t("home.trust.delivery.title") },
    { icon: RotateCcw, title: t("home.trust.returns.title", { days: returnsDays }) },
    { icon: Headphones, title: t("home.trust.support.title") },
  ] as const;

  return (
    <section
      className="border-b border-outline px-1 sm:px-20"
      style={{ backgroundColor: barColor }}
    >
      <div className="w-full py-1">
        <div className="relative overflow-hidden" aria-label={t("home.trust.cod.title")}>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
            style={{ backgroundImage: `linear-gradient(to right, ${barColor}, transparent)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
            style={{ backgroundImage: `linear-gradient(to left, ${barColor}, transparent)` }}
          />
          <div
            className="trustbar-mobile-marquee flex w-max animate-marquee"
            style={{ animation: "marquee-ltr 22s linear infinite" } as React.CSSProperties}
          >
            {[...items, ...items].map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex w-screen shrink-0 items-center justify-center gap-3 px-4 sm:w-[25vw]"
              >
                <span
                  className="grid size-15 shrink-0 place-items-center rounded-full border border-white/10"
                  style={{ backgroundColor: trustIconBackgroundColor }}
                >
                  <item.icon size={24} style={{ color: trustIconColor }} aria-hidden="true" />
                </span>
                <span className="truncate p-1 text-sm font-semibold text-[#939a8a] sm:text-base">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
