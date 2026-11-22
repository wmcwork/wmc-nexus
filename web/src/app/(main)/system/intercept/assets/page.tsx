"use client";

import * as React from "react";

import { BanIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import type { AssetInterceptKind, AssetInterceptRule } from "@/lib/types";

// ---- kind metadata ----

const KIND_OPTIONS: { value: AssetInterceptKind; label: string; group: string; placeholder: string }[] = [
  {
    value: "exact_domain",
    label: "interceptUiKindDomainExact",
    group: "interceptUiGroupExact",
    placeholder: "example.gov.cn",
  },
  { value: "exact_ip", label: "interceptUiKindIpExact", group: "interceptUiGroupExact", placeholder: "203.0.113.10" },
  {
    value: "exact_url",
    label: "interceptUiKindUrlExact",
    group: "interceptUiGroupExact",
    placeholder: "https://example.gov.cn/login",
  },
  {
    value: "fuzzy_domain",
    label: "interceptUiKindDomainFuzzy",
    group: "interceptUiGroupFuzzy",
    placeholder: ".gov.cn",
  },
  { value: "fuzzy_ip", label: "interceptUiKindIpFuzzy", group: "interceptUiGroupFuzzy", placeholder: "203.0.113." },
  { value: "fuzzy_url", label: "interceptUiKindUrlFuzzy", group: "interceptUiGroupFuzzy", placeholder: "/admin" },
  { value: "cidr", label: "interceptUiKindCidr", group: "interceptUiGroupCidr", placeholder: "192.168.0.0/16" },
];

const KIND_LABEL: Record<AssetInterceptKind, string> = Object.fromEntries(
  KIND_OPTIONS.map((o) => [o.value, o.label]),
) as Record<AssetInterceptKind, string>;

const KIND_GROUPS = ["interceptUiGroupExact", "interceptUiGroupFuzzy", "interceptUiGroupCidr"];

function KindBadge({ kind }: { kind: AssetInterceptKind }) {
  const { t } = useLocale();
  const fuzzy = kind.startsWith("fuzzy_");
  const cidr = kind === "cidr";
  return (
    <Badge
      variant="outline"
      className={
        cidr
          ? "border-sky-400 text-sky-600"
          : fuzzy
            ? "border-amber-400 text-amber-600"
            : "border-emerald-400 text-emerald-600"
      }
    >
      {t(KIND_LABEL[kind] as Parameters<typeof t>[0])}
    </Badge>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---- form state ----

type RuleForm = {
  enabled: boolean;
  kind: AssetInterceptKind;
  pattern: string;
  note: string;
};

const defaultForm = (): RuleForm => ({ enabled: true, kind: "fuzzy_domain", pattern: "", note: "" });

// Light frontend validation (matching the backend: only exact_ip / cidr get format checks, the rest is left to the backend).
function frontValidate(form: RuleForm): string | null {
  const p = form.pattern.trim();
  if (!p) return "interceptUiMatchContentRequired";
  if (form.kind === "cidr" && !/^[0-9a-fA-F:.]+\/\d{1,3}$/.test(p)) {
    return "interceptUiInvalidCidr";
  }
  return null;
}

// ---- page ----

export default function AssetInterceptPage() {
  const { t } = useLocale();
  const [rules, setRules] = React.useState<AssetInterceptRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AssetInterceptRule | null>(null);
  const [form, setForm] = React.useState<RuleForm>(defaultForm());
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setRules(await api.assetInterceptRules());
    } catch {
      toast.error(t("interceptUiAssetRulesLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    load();
  }, [load]);

  function set(patch: Partial<RuleForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function openNew() {
    setEditing(null);
    setForm(defaultForm());
    setOpen(true);
  }

  function openEdit(rule: AssetInterceptRule) {
    setEditing(rule);
    setForm({ enabled: rule.enabled, kind: rule.kind, pattern: rule.pattern, note: rule.note });
    setOpen(true);
  }

  async function handleSave() {
    const err = frontValidate(form);
    if (err) {
      toast.error(t(err as Parameters<typeof t>[0]));
      return;
    }
    const payload = { ...form, pattern: form.pattern.trim() };
    setSaving(true);
    try {
      if (editing) {
        await api.updateAssetInterceptRule(editing.id, payload);
        toast.success(t("interceptUiRuleUpdated"));
      } else {
        await api.createAssetInterceptRule(payload);
        toast.success(t("interceptUiRuleCreated"));
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: AssetInterceptRule) {
    if (!window.confirm(`${t("interceptUiConfirmDeleteAssetRule")} "${rule.pattern}"?`)) return;
    try {
      await api.deleteAssetInterceptRule(rule.id);
      toast.success(t("interceptUiRuleDeleted"));
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleToggle(rule: AssetInterceptRule) {
    try {
      await api.toggleAssetInterceptRule(rule.id, !rule.enabled);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const placeholder = KIND_OPTIONS.find((o) => o.value === form.kind)?.placeholder ?? "";

  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      {/* header */}
      <div className="flex items-center gap-2.5">
        <BanIcon className="h-5 w-5 shrink-0" />
        <div>
          <h1 className="text-lg font-semibold leading-tight">{t("interceptUiAssetTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("interceptUiAssetDesc")}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("interceptUiAssetHelp")}</p>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <PlusIcon className="h-4 w-4" />
          {t("interceptUiCreateRule")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">{t("findingLoading")}</p>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <BanIcon className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("interceptUiNoAssetRules")}</p>
              <Button size="sm" variant="outline" onClick={openNew}>
                <PlusIcon className="h-4 w-4" />
                {t("interceptUiCreateFirstRule")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[130px]">{t("taskUiType")}</TableHead>
                  <TableHead>{t("interceptUiColMatchContent")}</TableHead>
                  <TableHead>{t("interceptUiColNote")}</TableHead>
                  <TableHead className="w-[64px] text-center">{t("interceptUiColEnabled")}</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={!rule.enabled ? "opacity-40" : ""}>
                    <TableCell>
                      <KindBadge kind={rule.kind} />
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <code className="block truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {rule.pattern}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {rule.builtin && (
                          <Badge variant="secondary" className="shrink-0 px-1 py-0 text-[10px]">
                            {t("agentUiBuiltIn")}
                          </Badge>
                        )}
                        <span className="truncate">{rule.note}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(rule)}>
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule)}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* editor sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{editing ? t("interceptUiEditAssetRule") : t("interceptUiCreateAssetRule")}</SheetTitle>
            <SheetDescription className="text-xs">{t("interceptUiAssetSheetDesc")}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
            <Field label={t("interceptUiMatchType")}>
              <Select value={form.kind} onValueChange={(v) => set({ kind: v as AssetInterceptKind })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_GROUPS.map((g) => (
                    <React.Fragment key={g}>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(g as Parameters<typeof t>[0])}
                      </div>
                      {KIND_OPTIONS.filter((o) => o.group === g).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {t(o.label as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label={t("interceptUiColMatchContent")}
              hint={
                form.kind === "cidr"
                  ? t("interceptUiCidrHint")
                  : form.kind.startsWith("fuzzy_")
                    ? t("interceptUiFuzzyHint")
                    : t("interceptUiExactHint")
              }
            >
              <Input
                placeholder={placeholder}
                value={form.pattern}
                onChange={(e) => set({ pattern: e.target.value })}
              />
            </Field>

            <Field label={t("taskUiNoteOptional")}>
              <Textarea
                placeholder={t("interceptUiNotePlaceholder")}
                value={form.note}
                onChange={(e) => set({ note: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </Field>

            <Separator />

            <div className="flex items-center gap-3">
              <Switch id="asset-rule-enabled" checked={form.enabled} onCheckedChange={(v) => set({ enabled: v })} />
              <Label htmlFor="asset-rule-enabled" className="cursor-pointer">
                {t("interceptUiEnableRule")}
              </Label>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4 flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("taskUiSaving") : t("save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
