import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  tone?: "idle" | "ok" | "warn" | "fault";
}

export function StatTile({ label, value, unit, tone = "idle" }: StatTileProps) {
  return (
    <div className="rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="text-cluster text-subtle uppercase">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-xl font-medium tabular-nums tracking-tight sm:text-2xl",
            tone === "ok" && "text-ok",
            tone === "warn" && "text-warn",
            tone === "fault" && "text-fault",
            tone === "idle" && "text-fg",
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-subtle">{unit}</span> : null}
      </div>
    </div>
  );
}
