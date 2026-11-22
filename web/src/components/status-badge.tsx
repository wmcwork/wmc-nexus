import { cn } from "@/lib/utils";
import {
  statusMeta,
  toneClasses,
  toneDot,
  type StatusDomain,
  type Tone,
} from "@/lib/status";
import { type TranslationKey, useLocale } from "@/lib/locale";

const statusTranslationKeys: Record<string, TranslationKey> = {
  "intent:open": "statusOpen",
  "intent:running": "taskStatusRunning",
  "intent:paused": "taskStatusPaused",
  "intent:done": "taskStatusDone",
  "intent:blocked": "statusError",
  "intent:exhausted": "statusBudgetExhausted",
  "intent:stopped": "statusStopped",
  "intent:deleted": "statusDeleted",
  "task:created": "taskStatusCreated",
  "task:queued": "taskStatusQueued",
  "task:running": "taskStatusRunning",
  "task:paused": "taskStatusPaused",
  "task:done": "taskStatusDone",
  "task:failed": "taskStatusFailed",
  "task:timeout": "taskStatusTimeout",
  "severity:critical": "severityCritical",
  "severity:high": "severityHigh",
  "severity:medium": "severityMedium",
  "severity:low": "severityLow",
  "finding:pending": "statusPending",
  "finding:in_progress": "statusInProgress",
  "finding:confirmed": "statusConfirmed",
  "finding:resolved": "statusResolved",
  "finding:fixed": "statusFixed",
  "finding:false_positive": "statusFalsePositive",
  "finding:ignored": "statusIgnored",
  "finding:duplicate": "statusDuplicate",
  "finding:risk_accepted": "statusRiskAccepted",
  "engine:exploring": "dashboardExploring",
  "engine:paused": "dashboardPaused",
  "engine:stalled": "statusStalled",
  "engine:idle": "statusIdle",
  "goal:open": "statusInProgress",
  "goal:met": "statusMet",
  "goal:abandoned": "statusAbandoned",
  "audit:allow": "statusAllow",
  "audit:block": "statusBlock",
  "node:observed": "statusObserved",
  "node:confirmed": "statusConfirmed",
  "node:tombstoned": "statusTombstoned",
  "delivery:pending": "statusPending",
  "delivery:sending": "statusSending",
  "delivery:sent": "statusSent",
  "delivery:failed": "taskStatusFailed",
  "delivery:skipped": "statusSkipped",
};

export function StatusBadge({
  domain,
  value,
  dot = false,
  className,
}: {
  domain: StatusDomain;
  value: string;
  dot?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const meta = statusMeta(domain, value);
  const translationKey = statusTranslationKeys[`${domain}:${value}`];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[meta.tone],
        className,
      )}
    >
      {dot && (
        <span className={cn("size-1.5 rounded-full", toneDot[meta.tone])} />
      )}
      {translationKey ? t(translationKey) : meta.label}
    </span>
  );
}

export function ToneDot({ tone }: { tone: Tone }) {
  return <span className={cn("size-2 rounded-full", toneDot[tone])} />;
}
