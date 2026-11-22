"use client";

import { CheckIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type TranslationKey, useLocale } from "@/lib/locale";
import type { NotificationFilter } from "@/lib/types";

// asText / inputType are value helpers local to this file (tightly coupled to control rendering); they do not belong in channel-fields.
import { type FieldDef, type FieldKind } from "./channel-fields";

// asText renders any config value as a string an input can use.
// config comes from JSON; values may be string / number / boolean / array / null.
// All it cares about is "can it go into a text box" — actual serialization is buildConfig's job.
function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  return String(v);
}

// inputType maps a field kind to the input's type attribute.
function inputType(kind: FieldKind): "text" | "password" | "number" {
  if (kind === "password") return "password";
  if (kind === "number") return "number";
  return "text";
}

const CONFIG_LABELS: Record<string, TranslationKey> = {
  webhook: "notifyWebhookUrl",
  url: "notifyTargetUrl",
  method: "notifyHttpMethod",
  headers: "notifyCustomHeaders",
  body_template: "notifyBodyTemplate",
  bot_token: "notifyBotToken",
  chat_id: "notifyChatId",
  base_url: "notifyApiUrl",
  host: "notifySmtpServer",
  port: "notifyPort",
  username: "notifyAccount",
  password: "notifyPasswordAuth",
  from: "notifyFrom",
  to: "notifyRecipients",
  tls: "notifyImplicitTls",
};

const CONFIG_LABELS_BY_TEXT: Record<string, TranslationKey> = {
  "Signing secret": "notifySigningSecret",
  "Signature verification secret": "notifySignatureSecret",
};

const CONFIG_HELP: Partial<Record<string, TranslationKey>> = {
  headers: "notifyHeadersHelp",
  body_template: "notifyBodyTemplateHelp",
  base_url: "notifyApiUrlHelp",
  port: "notifyPortHelp",
  to: "notifyRecipientsHelp",
  tls: "notifyTlsHelp",
};

const CONFIG_HELP_BY_TEXT: Record<string, TranslationKey> = {
  "Fill in when the robot's security settings use 'Sign'; leave empty for 'Custom keywords' or when no security setting is enabled":
    "notifyDingTalkSecretHelp",
  "Fill in when the robot enables 'Signature verification'; otherwise leave empty": "notifyFeishuSecretHelp",
  "Leave empty for the official URL; fill in when proxying a self-hosted Bot API": "notifyTelegramApiHelp",
};

const METHOD_LABELS: Record<string, TranslationKey> = {
  "POST (with body)": "notifyHttpPost",
  "PUT (with body)": "notifyHttpPut",
  "PATCH (with body)": "notifyHttpPatch",
  "GET (no body)": "notifyHttpGet",
};

// ConfigField renders the control matching a field definition.
//
// Masked fields are the one subtlety here: the input **does not show** the masked value itself, only a
// "Saved" line. That leaves one rule on screen — text in the box means the user typed it,
// an empty box means an empty value. Putting "__masked__:…abc123" into the input would look like placeholder
// text to delete, making accidental credential wipes more likely.
export function ConfigField({
  def,
  value,
  isSecret,
  onChange,
}: {
  def: FieldDef;
  value: unknown;
  isSecret: boolean;
  onChange: (v: unknown) => void;
}) {
  const { t } = useLocale();
  const id = `n-cfg-${def.key}`;
  const raw = asText(value);
  const labelKey = CONFIG_LABELS_BY_TEXT[def.label] ?? CONFIG_LABELS[def.key];
  const label = labelKey ? t(labelKey) : def.label;
  const helpKey = CONFIG_HELP[def.key];
  const translatedHelpKey = def.help ? CONFIG_HELP_BY_TEXT[def.help] : undefined;
  const help = translatedHelpKey ? t(translatedHelpKey) : helpKey ? t(helpKey) : def.help;
  // Backend-echoed masked value: shaped like "__masked__:…abc123", with a recognizable tail of the original value.
  const masked = isSecret && raw.startsWith("__masked__");
  const maskedTail = masked ? (raw.split("…")[1] ?? "") : "";

  if (def.kind === "switch") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Switch checked={value === true} onCheckedChange={onChange} aria-label={label} />
        {label}
        {help && <span className="text-muted-foreground">({help})</span>}
      </div>
    );
  }

  if (def.kind === "select") {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <Select value={raw || def.options?.[0]?.value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(def.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {METHOD_LABELS[o.label] ? t(METHOD_LABELS[o.label]) : o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Controls dispatch on field kind. An if chain rather than nested ternaries, because four controls need distinguishing
  // and a three-deep ternary already forces the reader to stop and count brackets.
  function control() {
    if (def.kind === "textarea" || def.kind === "kv") {
      return (
        <Textarea
          id={id}
          className="font-mono"
          placeholder={def.placeholder}
          value={masked ? "" : raw}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    if (def.kind === "list") {
      return (
        <Input
          id={id}
          value={Array.isArray(value) ? (value as string[]).join(", ") : raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
      );
    }
    return (
      <Input
        id={id}
        className={def.kind === "text" ? "font-mono" : ""}
        type={inputType(def.kind)}
        placeholder={def.placeholder}
        value={masked ? "" : raw}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  const hint = masked ? (
    <p className="text-muted-foreground flex items-center gap-1 text-xs">
      <CheckIcon className="size-3" />
      {t("notifySecretSaved")}{maskedTail ? ` (${t("notifySecretTail")} ${maskedTail})` : ""} · {t("notifySecretOverwrite")}
    </p>
  ) : (
    help && <p className="text-muted-foreground text-xs">{help}</p>
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {control()}
      {hint}
    </div>
  );
}

// FilterSummary condenses the filter into one line so the card shows what a channel pushes without expanding it.
export function FilterSummary({ filter }: { filter: NotificationFilter }) {
  const { t } = useLocale();
  const severityLabels: Record<string, TranslationKey> = {
    "": "notifySeverityAll",
    low: "notifySeverityLow",
    medium: "notifySeverityMedium",
    high: "notifySeverityHigh",
    critical: "notifySeverityCritical",
  };
  const parts: string[] = [];
  if (filter.min_severity) {
    parts.push(t(severityLabels[filter.min_severity] ?? "notifySeverityAll"));
  }
  if (filter.vulnclass_include?.length) parts.push(`${filter.vulnclass_include.length} ${t("notifyTypeKeywords")}`);
  if (filter.vulnclass_exclude?.length) parts.push(`${t("notifyExcludeKeywords")} ${filter.vulnclass_exclude.length}`);
  if (filter.task_ids?.length) parts.push(`${filter.task_ids.length} ${t("notifyTasks")}`);
  if (filter.asset_ids?.length) parts.push(`${filter.asset_ids.length} ${t("notifyAssets")}`);
  if (filter.on_status_change) parts.push(t("notifyIncludesStatusChanges"));
  if (parts.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("notifyAllVulnerabilities")}</p>;
  }
  return <p className="text-muted-foreground text-sm">{parts.join(" · ")}</p>;
}
