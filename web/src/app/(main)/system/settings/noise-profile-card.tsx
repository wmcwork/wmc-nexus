"use client";

import * as React from "react";

import { GaugeIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { type TranslationKey, useLocale } from "@/lib/locale";
import type { NoiseProfileName, NoiseStatus } from "@/lib/types";

// Mirrors egress.Profiles in egress/egress.go; the jitter of one send is
// min(Jitter/RPS, 250 ms).
const profiles: { value: NoiseProfileName; labelKey: TranslationKey; limitsKey: TranslationKey }[] = [
  { value: "off", labelKey: "settingsUiNoiseOff", limitsKey: "settingsUiNoiseOffLimits" },
  {
    value: "quiet",
    labelKey: "settingsUiNoiseQuiet",
    limitsKey: "settingsUiNoiseQuietLimits",
  },
  {
    value: "balanced",
    labelKey: "settingsUiNoiseBalanced",
    limitsKey: "settingsUiNoiseBalancedLimits",
  },
  {
    value: "aggressive",
    labelKey: "settingsUiNoiseAggressive",
    limitsKey: "settingsUiNoiseAggressiveLimits",
  },
];

// NoiseProfileCard sets the target noise profile and shows the per-host
// counters of the current minute.
export function NoiseProfileCard() {
  const { t } = useLocale();
  const [status, setStatus] = React.useState<NoiseStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(() => {
    setLoading(true);
    api
      .noiseStatus()
      .then(setStatus)
      .catch((e) => toast.error(t("settingsUiNoiseLoadFailed") + ": " + (e as Error).message))
      .finally(() => setLoading(false));
  }, [t]);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const save = (value: NoiseProfileName) => {
    setSaving(true);
    api
      .setSettings({ noise_profile: value })
      .then(() => {
        const label = t(profiles.find((p) => p.value === value)?.labelKey ?? "settingsUiNoiseOff");
        toast.success(t("settingsUiNoiseSetTo") + ": " + label);
        refresh();
      })
      .catch((e) => toast.error(t("saveFailed") + ": " + (e as Error).message))
      .finally(() => setSaving(false));
  };

  const current = profiles.find((p) => p.value === status?.profile) ?? profiles[0];
  return (
    <Card className="mb-4 break-inside-avoid md:mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GaugeIcon className="size-4" />
          {t("settingsUiNoiseTitle")}
        </CardTitle>
        <CardDescription>{t("settingsUiNoiseDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="noise-profile" className="text-sm font-normal text-muted-foreground">
            {t("llmRecordsProfile")}
          </Label>
          <Select
            value={status?.profile ?? ""}
            disabled={!status || saving}
            onValueChange={(v) => save(v as NoiseProfileName)}
          >
            <SelectTrigger id="noise-profile" className="w-48 shrink-0">
              <SelectValue placeholder={t("taskUiLoading")} />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-xs">{t(current.limitsKey)}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-sm">{t("settingsUiNoiseHosts")}</span>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCwIcon data-icon="inline-start" className={loading ? "animate-spin" : undefined} />
            {t("workspaceRefresh")}
          </Button>
        </div>
        {status?.hosts.length ? (
          <Table aria-label={t("settingsUiNoiseTableAria")}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settingsUiHost")}</TableHead>
                <TableHead className="text-right">{t("settingsUiRpm")}</TableHead>
                <TableHead className="text-right">{t("settingsUiPeakRpm")}</TableHead>
                <TableHead className="text-right">{t("settingsUiInFlightPeak")}</TableHead>
                <TableHead className="text-right">{t("settingsUiDuplicates")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.hosts.map((h) => (
                <TableRow key={h.host}>
                  <TableCell className="max-w-48 truncate font-mono text-xs" title={h.host}>
                    {h.host}
                  </TableCell>
                  <TableCell className="text-right">{h.rpm}</TableCell>
                  <TableCell className="text-right">{h.peak_rpm}</TableCell>
                  <TableCell className="text-right">
                    {h.inflight} ({h.peak_inflight})
                  </TableCell>
                  <TableCell className="text-right">{h.duplicates_avoided}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">
            {status?.profile === "off" ? t("settingsUiNoiseOffCounts") : t("settingsUiNoiseNoRequest")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
