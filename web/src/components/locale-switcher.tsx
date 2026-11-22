"use client";

import { useLocale } from "@/lib/locale";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <select
      aria-label={t("language")}
      value={locale}
      onChange={(event) => setLocale(event.target.value === "tr" ? "tr" : "en")}
      className="h-8 rounded-md border bg-background px-2 text-xs"
    >
      <option value="en">English</option>
      <option value="tr">Türkçe</option>
    </select>
  );
}
