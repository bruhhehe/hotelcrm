/**
 * Intl locale for a hotel's display locale and currency: "en" with GBP formats as en-GB (£1,234.50),
 * with USD as en-US, with CAD as en-CA; other languages use their main country.
 */
export function intlLocale(locale: string, currency: string): string {
  if (locale === "en") {
    return currency === "USD"
      ? "en-US"
      : currency === "CAD"
        ? "en-CA"
        : currency === "EUR"
          ? "en-IE"
          : "en-GB";
  }
  const country: Record<string, string> = { fr: "fr-FR", de: "de-DE", nl: "nl-NL", es: "es-ES" };
  return country[locale] ?? "en-GB";
}

/** A price for display, dropping ".00" on whole amounts: £125, £125.50. */
export function formatPrice(amount: number, currency: string, locale = "en-GB"): string {
  const whole = amount % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

/** Basis points as a percentage: 2000 → "20%", 1250 → "12.5%". */
export function formatPercent(bp: number, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(
    bp / 10000,
  );
}

/** The currency's symbol in this locale: "£", "€", "$", "CA$". */
export function currencySymbol(currency: string, locale = "en-GB"): string {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}
