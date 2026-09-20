import { cn } from "@/lib/utils";

interface LinearGaugeProps {
  label: string;
  value: number;
  display: string;
  unit: string;
  min: number;
  max: number;
  warnFrom?: number;
  faultFrom?: number;
  invert?: boolean;
  rail?: boolean;
}

export function LinearGauge({
  label,
  value,
  display,
  unit,
  min,
  max,
  warnFrom,
  faultFrom,
  invert = false,
  rail = false,
}: LinearGaugeProps) {
  const span = Math.max(0.0001, max - min);
  const t = Math.min(1, Math.max(0, (value - min) / span));
  const tone =
    faultFrom !== undefined && value >= faultFrom
      ? "fault"
      : warnFrom !== undefined && value >= warnFrom
        ? "warn"
        : invert && t < 0.22
          ? "warn"
          : "ok";
  const fill = cn(
    "rounded-full",
    tone === "ok" && "bg-accent",
    tone === "warn" && "bg-warn",
    tone === "fault" && "bg-fault",
  );

  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]",
        rail && "lg:h-full lg:flex-col lg:items-stretch lg:gap-2 lg:px-3 lg:py-4",
      )}
    >
      <div
        className={cn(
          "flex min-w-16 flex-1 items-baseline gap-1.5",
          rail && "lg:min-w-0 lg:flex-none lg:justify-between",
        )}
      >
        <span className={cn("text-cluster uppercase text-subtle", rail && "lg:hidden")}>{label}</span>
        <span
          className={cn(
            "font-mono text-lg font-medium tabular-nums tracking-tight",
            rail && "lg:text-2xl",
            tone === "ok" && "text-fg",
            tone === "warn" && "text-warn",
            tone === "fault" && "text-fault",
          )}
        >
          {display}
        </span>
        <span className="text-xs text-subtle">{unit}</span>
      </div>
      <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-inset", rail && "lg:hidden")}>
        <div className={cn("h-full gauge-fill", fill)} style={{ width: `${t * 100}%` }} />
      </div>
      {rail ? (
        <>
          <div className="relative hidden h-28 w-2.5 self-center overflow-hidden rounded-full bg-inset lg:block">
            <div className={cn("absolute bottom-0 w-full gauge-fill", fill)} style={{ height: `${t * 100}%` }} />
          </div>
          <span className="hidden text-center text-cluster uppercase text-subtle lg:block">{label}</span>
        </>
      ) : null}
    </div>
  );
}
