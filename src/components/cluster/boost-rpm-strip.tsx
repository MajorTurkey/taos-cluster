import { boostPsi, type HistoryPoint, type Telemetry, type Units } from "@/lib/obd/types";

export function BoostRpmStrip({
  telemetry,
  history,
  units,
}: {
  telemetry: Telemetry;
  history: HistoryPoint[];
  units: Units;
}) {
  const pts = history.slice(-48);
  const boostNow = units === "us" ? boostPsi(telemetry) : (telemetry.mapKpa - telemetry.baroKpa) / 100;
  const w = 240;
  const h = 36;
  const boostLine = pts
    .map((p, i) => {
      const x = pts.length < 2 ? 0 : (i / (pts.length - 1)) * w;
      const psi = p.boostPsi;
      const y = h - ((psi + 8) / 28) * h;
      return `${x.toFixed(1)},${Math.min(h, Math.max(0, y)).toFixed(1)}`;
    })
    .join(" ");
  const rpmLine = pts
    .map((p, i) => {
      const x = pts.length < 2 ? 0 : (i / (pts.length - 1)) * w;
      const y = h - (Math.min(1, p.rpm / 6500) * h);
      return `${x.toFixed(1)},${Math.min(h, Math.max(0, y)).toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="col-span-3 flex items-center gap-3 px-2">
      <div className="min-w-16 text-center">
        <div className="text-cluster uppercase text-subtle">Boost·RPM</div>
        <div className="font-mono text-sm tabular-nums text-accent">
          {boostNow.toFixed(1)}
          <span className="ml-1 text-[10px] text-subtle">{units === "us" ? "psi" : "bar"}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-10 min-w-0 flex-1" preserveAspectRatio="none">
        <line x1="0" y1={h * (8 / 28)} x2={w} y2={h * (8 / 28)} stroke="color-mix(in oklab, var(--color-accent) 28%, transparent)" strokeWidth="0.6" />
        {rpmLine ? (
          <polyline fill="none" stroke="color-mix(in oklab, white 28%, transparent)" strokeWidth="1.2" points={rpmLine} />
        ) : null}
        {boostLine ? (
          <polyline fill="none" stroke="var(--color-accent)" strokeWidth="1.8" points={boostLine} />
        ) : null}
      </svg>
      <div className="hidden text-[10px] uppercase tracking-widest text-subtle sm:block">
        dim = rpm · neon = boost
      </div>
    </div>
  );
}
