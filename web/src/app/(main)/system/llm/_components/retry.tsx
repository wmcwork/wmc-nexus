"use client";

// Shared pieces of the LLM retry settings: "attempts + interval" for each of the five retry layers.
//
// The five layers, innermost to outermost: connect (SDK) → empty response (SDK) → same-provider safe window → pool breaker → intent rerun.
// The first three travel with the endpoint, so every model profile can override the global defaults; the last two are process-level and exist only once globally.
//
// All inputs follow the same "empty = unconfigured" semantics, matching the backend db.RetryRule:
//   attempts   empty/0 = built-in default | -1 = disable this layer's retries | >0 = use this count
//   interval   empty/0 = this layer's original exponential backoff | >0 = use this fixed interval in milliseconds

import * as React from "react";

import { Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { type TranslationKey, useLocale } from "@/lib/locale";
import type { LLMRetryOverride, LLMRetryPolicy, LLMRetryRule } from "@/lib/types";

export const ZERO_RULE: LLMRetryRule = { attempts: 0, interval_ms: 0 };
export const ZERO_OVERRIDE: LLMRetryOverride = {
  connect: ZERO_RULE,
  empty: ZERO_RULE,
  stream: ZERO_RULE,
};
const ZERO_POLICY: LLMRetryPolicy = {
  ...ZERO_OVERRIDE,
  breaker: ZERO_RULE,
  intent: ZERO_RULE,
};

type LayerMeta = {
  title: TranslationKey;
  /** Where this retry layer happens and who runs it */
  where: TranslationKey;
  /** Which errors reach this layer — down to status codes, no guessing */
  trigger: TranslationKey;
  /** Errors that look similar but do [not] go through this layer, so nobody thinks it is a bug after seeing no effect */
  skips?: TranslationKey;
  desc: TranslationKey;
  attemptsLabel: TranslationKey;
  /** Default attempts when left empty, used for the placeholder */
  defAttempts: number;
  /** Default interval strategy when left empty, used for the placeholder */
  defInterval: TranslationKey;
  /** Meaning of entering -1 for attempts */
  offHint: TranslationKey;
};

export const RETRY_LAYERS = {
  connect: {
    title: "llmUiRetryConnectTitle",
    where: "llmUiRetryConnectWhere",
    trigger: "llmUiRetryConnectTrigger",
    skips: "llmUiRetryConnectSkips",
    desc: "llmUiRetryConnectDesc",
    attemptsLabel: "llmUiRetryAttempts",
    defAttempts: 3,
    defInterval: "llmUiRetryExpInterval8",
    offHint: "llmUiRetryConnectOffHint",
  },
  empty: {
    title: "llmUiRetryEmptyTitle",
    where: "llmUiRetryEmptyWhere",
    trigger: "llmUiRetryEmptyTrigger",
    skips: "llmUiRetryEmptySkips",
    desc: "llmUiRetryEmptyDesc",
    attemptsLabel: "llmUiRetryAttempts",
    defAttempts: 2,
    defInterval: "llmUiRetryExpInterval8",
    offHint: "llmUiRetryEmptyOffHint",
  },
  stream: {
    title: "llmUiRetryStreamTitle",
    where: "llmUiRetryStreamWhere",
    trigger: "llmUiRetryStreamTrigger",
    skips: "llmUiRetryStreamSkips",
    desc: "llmUiRetryStreamDesc",
    attemptsLabel: "llmUiRetryAttempts",
    defAttempts: 2,
    defInterval: "llmUiRetryExpInterval4",
    offHint: "llmUiRetryStreamOffHint",
  },
  breaker: {
    title: "llmUiRetryBreakerTitle",
    where: "llmUiRetryBreakerWhere",
    trigger: "llmUiRetryBreakerTrigger",
    skips: "llmUiRetryBreakerSkips",
    desc: "llmUiRetryBreakerDesc",
    attemptsLabel: "llmUiBreakerAttempts",
    defAttempts: 3,
    defInterval: "llmUiRetryCooldownGradient",
    offHint: "llmUiRetryBreakerOffHint",
  },
  intent: {
    title: "llmUiRetryIntentTitle",
    where: "llmUiRetryIntentWhere",
    trigger: "llmUiRetryIntentTrigger",
    skips: "llmUiRetryIntentSkips",
    desc: "llmUiRetryIntentDesc",
    attemptsLabel: "llmUiIntentAttempts",
    defAttempts: 2,
    defInterval: "llmUiRetryFixed3s",
    offHint: "llmUiRetryIntentOffHint",
  },
} satisfies Record<string, LayerMeta>;

type LayerKey = keyof typeof RETRY_LAYERS;

/** Milliseconds in human terms, only echoed next to the input so nobody counts zeros. */
function humanMs(ms: number, t: (key: TranslationKey) => string) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Number((ms / 1000).toFixed(2))}${t("llmUiUnitSeconds")}`;
  return `${Number((ms / 60_000).toFixed(2))}${t("llmUiUnitMinutes")}`;
}

/** Controlled numeric input: empty string ↔ 0; intermediate states ("-", "1e") stay local and never bother the parent. */
function NumField({
  id,
  value,
  onChange,
  placeholder,
  min,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  placeholder: string;
  min: number;
}) {
  const [text, setText] = React.useState(value === 0 ? "" : String(value));
  // Keeps up when the parent swaps in a whole new set of values (policy loaded, profile switched); typing never reaches this,
  // because by then value already equals the parsed result of the local text.
  React.useEffect(() => {
    const incoming = value === 0 ? "" : String(value);
    setText((cur) => (Number(cur || 0) === value ? cur : incoming));
  }, [value]);
  return (
    <Input
      id={id}
      type="number"
      min={min}
      className="w-28 shrink-0"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        onChange(e.target.value.trim() === "" || !Number.isFinite(n) ? 0 : Math.trunc(n));
      }}
    />
  );
}

/** The two knobs of one retry layer. idPrefix keeps the label's htmlFor unique when it appears multiple times on one page. */
export function RetryRuleFields({
  layer,
  idPrefix,
  value,
  onChange,
  compact,
}: {
  layer: LayerKey;
  idPrefix: string;
  value: LLMRetryRule;
  onChange: (r: LLMRetryRule) => void;
  /** true = compact version inside the profile drawer: skips the expanded explanations, keeping only the "which errors reach this layer" line */
  compact?: boolean;
}) {
  const { t } = useLocale();
  const meta = RETRY_LAYERS[layer];
  const human = humanMs(value.interval_ms, t);
  return (
    <div className={compact ? "grid gap-2" : "grid gap-3 rounded-lg border p-3"}>
      <div className="grid gap-0.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <Label className="text-sm">{t(meta.title)}</Label>
          <span className="text-muted-foreground text-xs">{t(meta.where)}</span>
        </div>
        {/* Which errors reach this layer, down to status codes — if the knobs seem to have no effect, the error most likely does not land on this layer at all. */}
        <p className="text-muted-foreground text-xs">
          <span className="font-medium text-foreground">{t("llmUiTriggers")}</span>: {t(meta.trigger)}
        </p>
        {!compact && meta.skips && (
          <p className="text-muted-foreground text-xs">
            <span className="font-medium text-foreground">{t("llmUiSkippedHere")}</span>: {t(meta.skips)}
          </p>
        )}
        {!compact && <p className="text-muted-foreground text-xs">{t(meta.desc)}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${idPrefix}-${layer}-n`} className="text-muted-foreground text-xs">
            {t(meta.attemptsLabel)}
          </Label>
          <NumField
            id={`${idPrefix}-${layer}-n`}
            min={-1}
            value={value.attempts}
            placeholder={`${t("llmUiDefault")} ${meta.defAttempts}`}
            onChange={(n) => onChange({ ...value, attempts: n })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${idPrefix}-${layer}-ms`} className="text-muted-foreground text-xs">
            {t("llmUiIntervalMs")}
          </Label>
          <NumField
            id={`${idPrefix}-${layer}-ms`}
            min={0}
            value={value.interval_ms}
            placeholder={t("llmUiDefaultBackoff")}
            onChange={(n) => onChange({ ...value, interval_ms: n })}
          />
          <span className="text-muted-foreground text-xs">
            {human ? `${t("llmUiFixed")} ${human}` : t(meta.defInterval)}
          </span>
        </div>
      </div>
      {!compact && (
        <p className="text-muted-foreground text-xs">
          {t("llmUiEmptyUseDefault")} {t(meta.offHint)}.
        </p>
      )}
    </div>
  );
}

/** The three-layer override in the model profile drawer (the three layers that travel with the endpoint). */
export function ProfileRetryFields({
  value,
  onChange,
}: {
  value: LLMRetryOverride;
  onChange: (o: LLMRetryOverride) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="grid gap-0.5">
        <Label className="text-sm">{t("llmUiRetryOverrides")}</Label>
        <p className="text-muted-foreground text-xs">{t("llmUiRetryOverridesHelp")}</p>
      </div>
      {(["connect", "empty", "stream"] as const).map((k) => (
        <div key={k} className="border-t pt-3 first:border-t-0 first:pt-0">
          <RetryRuleFields
            compact
            layer={k}
            idPrefix="pf"
            value={value[k]}
            onChange={(r) => onChange({ ...value, [k]: r })}
          />
        </div>
      ))}
    </div>
  );
}

/** The "Retry & backoff" tab: global defaults for the five layers. */
export function RetryPolicyPanel() {
  const { t } = useLocale();
  const [policy, setPolicy] = React.useState<LLMRetryPolicy>(ZERO_POLICY);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = await api.llmRetryPolicy();
      setPolicy({ ...ZERO_POLICY, ...p });
    } catch (e) {
      toast.error(`${t("llmUiRetryLoadFailed")} ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      // The backend clamps out-of-range values back into the interval and returns them; refresh straight from the reply so what you see is what is stored.
      const saved = await api.saveLLMRetryPolicy(policy);
      setPolicy({ ...ZERO_POLICY, ...saved });
      toast.success(t("llmUiRetrySaved"));
    } catch (e) {
      toast.error(`${t("llmUiSaveFailed")} ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const set = (k: LayerKey) => (r: LLMRetryRule) => setPolicy((p) => ({ ...p, [k]: r }));

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-10 text-muted-foreground text-sm">
        <Loader2Icon className="size-4 animate-spin" /> {t("llmUiLoadingRetryPolicy")}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-muted-foreground text-xs leading-relaxed">
        {t("llmUiRetryIntroBefore")}
        <span className="text-foreground">{t("llmUiRetryIntroChain")}</span>
        {t("llmUiRetryIntroMiddle")}
        <span className="text-foreground">{t("llmUiRetryIntroMultiply")}</span>
        {t("llmUiRetryIntroAfter")}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(RETRY_LAYERS) as LayerKey[]).map((k) => (
          <RetryRuleFields key={k} layer={k} idPrefix="gl" value={policy[k]} onChange={set(k)} />
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          {t("save")}
        </Button>
        <Button variant="outline" onClick={() => setPolicy(ZERO_POLICY)} disabled={saving}>
          {t("llmUiResetAll")}
        </Button>
      </div>
    </div>
  );
}
