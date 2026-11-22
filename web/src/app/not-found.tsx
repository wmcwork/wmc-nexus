"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      <Link prefetch={false} replace href="/function/tasks">
        <Button variant="outline">{t("notFoundHome")}</Button>
      </Link>
    </div>
  );
}
