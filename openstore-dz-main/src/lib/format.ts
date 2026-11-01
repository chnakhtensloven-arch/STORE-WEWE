/**
 * Formatting helpers.
 *
 * Money is an integer number of dinar everywhere in the database. These
 * functions format, they never do arithmetic — all money math happens in
 * Postgres, so no float ever touches a price.
 *
 * Prices always render in Western digits, even inside Arabic text. Algerian
 * commerce quotes prices in Western numerals, and Arabic-Indic digits in a
 * price tag read as foreign. The unit suffix differs by language though, so
 * both are provided.
 */

import type { Locale } from "./i18n";

const UNIT: Record<Locale, string> = {
  ar: "دج",
  fr: "DA",
  en: "DA",
};

/** "2 500 دج" in Arabic, "2 500 DA" in French and English. */
export function formatDzd(amount: number, locale: Locale = "ar"): string {
  const digits = new Intl.NumberFormat("en-US").format(Math.round(amount));
  return `${digits} ${UNIT[locale]}`;
}

const DATE_LOCALE: Record<Locale, string> = {
  ar: "ar-DZ",
  fr: "fr-DZ",
  en: "en-GB",
};

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.+)?$/.exec(iso.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const daysInMonth = new Date(Number(year), monthNumber, 0).getDate();
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > daysInMonth) {
    return null;
  }

  const date =
    iso.trim().length === 10
      ? new Date(Number(year), monthNumber - 1, dayNumber)
      : new Date(iso.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  iso: string | null | undefined,
  locale: Locale = "ar",
  dateStyle: "long" | "medium" = "medium",
): string {
  const date = parseIsoDate(iso);
  if (!date) return "—";

  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { dateStyle }).format(date);
}

export function formatDateTime(iso: string | null | undefined, locale: Locale = "ar"): string {
  const date = parseIsoDate(iso);
  if (!date) return "—";

  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Short "3 days ago" style label, used on reviews and the order queue. */
export function formatRelative(iso: string | null | undefined, locale: Locale = "ar"): string {
  const date = parseIsoDate(iso);
  if (!date) return "—";

  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return locale === "ar" ? "اليوم" : locale === "fr" ? "aujourd'hui" : "today";
  if (days === 1) return locale === "ar" ? "أمس" : locale === "fr" ? "hier" : "yesterday";
  if (days < 30) {
    const n = days;
    return locale === "ar" ? `قبل ${n} يوم` : locale === "fr" ? `il y a ${n} j` : `${n} days ago`;
  }
  return formatDate(iso, locale);
}

/** Initials for an avatar fallback when a reviewer has no photo. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

/** Turn a product name into a URL-safe slug. Arabic letters are preserved. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
