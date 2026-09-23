import { cn } from "@/lib/utils";

interface ArcGaugeProps {
  value: number;
  min: number;
  max: number;
  display: string;
  label: string;
  unit: string;
  warnFrom?: number;
  faultFrom?: number;
  ticks?: number;
  className?: string;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function ArcGauge({
  value,
  min,
  max,
  display,
  label,
  unit,
  warnFrom,
  faultFrom,
  ticks = 9,
  className,
}: ArcGaugeProps) {
  const start = -120;
  const sweep = 240;
  const span = Math.max(0.0001, max - min);
  const t = Math.min(1, Math.max(0, (value - min) / span));
  const angle = start + sweep * t;
  const hot =
    faultFrom !== undefined && value >= faultFrom
      ? "fault"
      : warnFrom !== undefined && value >= warnFrom
        ? "warn"
        : "ok";
  const stroke =
    hot === "fault" ? "var(--color-fault)" : hot === "warn" ? "var(--color-warn)" : "var(--color-accent)";
  const needle = polar(50, 54, 34, angle);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg viewBox="0 0 100 78" className="h-auto w-full max-h-[46vh]">
        <defs>
          <filter id="neon-arc" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={arcPath(50, 54, 38, start, start + sweep)}
          fill="none"
          stroke="color-mix(in oklab, var(--color-accent) 22%, #061018)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d={arcPath(50, 54, 38, start, angle)}
          fill="none"
          stroke={stroke}
          strokeWidth="4.4"
          strokeLinecap="round"
          className="gauge-arc"
          filter="url(#neon-arc)"
        />
        {Array.from({ length: ticks }).map((_, i) => {
          const a = start + (sweep * i) / (ticks - 1);
          const outer = polar(50, 54, 43.2, a);
          const inner = polar(50, 54, i % 2 === 0 ? 36.2 : 38.4, a);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="color-mix(in oklab, var(--color-accent) 55%, white)"
              strokeWidth={i % 2 === 0 ? 0.85 : 0.4}
              opacity={0.7}
            />
          );
        })}
        <line
          x1={50}
          y1={54}
          x2={needle.x}
          y2={needle.y}
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          className="gauge-needle"
        />
        <circle cx="50" cy="54" r="2.6" fill={stroke} />
        <circle cx="50" cy="54" r="1.1" fill="#031016" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[42%] text-center">
        <div className="text-cluster uppercase text-subtle">{label}</div>
        <div
          className={cn(
            "font-mono text-[clamp(2.4rem,8vw,4.6rem)] leading-none tabular-nums tracking-tight",
            hot === "fault" ? "cluster-glow-hot text-fault" : "cluster-glow",
          )}
        >
          {display}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-subtle">{unit}</div>
      </div>
    </div>
  );
}
