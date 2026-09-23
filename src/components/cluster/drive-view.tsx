import { ConnectBanner } from "@/components/cluster/connect-guide";
import { ArcGauge } from "@/components/cluster/arc-gauge";
import { formatNum, formatPid, instantMpg, tempTone, voltTone } from "@/lib/obd/format";
import { boostPsi } from "@/lib/obd/types";
import { useApp } from "@/lib/store";
import { VEHICLE } from "@/lib/taos/specs";
import { cn } from "@/lib/utils";

export function DriveView() {
  const t = useApp((s) => s.telemetry);
  const units = useApp((s) => s.units);
  const mil = t.mil;
  const speed = formatPid("speed", t, units);
  const rpm = formatPid("rpm", t, units);
  const boost = formatPid("boost", t, units);
  const mpg = formatNum(instantMpg(t), 1);
  const speedVal = units === "us" ? t.speedKmh * 0.621371 : t.speedKmh;

  const pills = [
    { label: "Gear", value: String(t.gear) },
    { label: "Boost", value: boost, unit: units === "us" ? "psi" : "bar" },
    { label: units === "us" ? "MPG" : "L/100", value: mpg },
    { label: "Load", value: `${formatPid("load", t, units)}%` },
    { label: "Cool", value: formatPid("coolant", t, units), tone: tempTone(t.coolantC, "coolant") },
    { label: "Oil", value: formatPid("oilTemp", t, units), tone: tempTone(t.oilTempC, "oil") },
    { label: "ATF", value: formatPid("transTemp", t, units), tone: tempTone(t.transTempC, "trans") },
    { label: "Batt", value: formatPid("voltage", t, units), tone: voltTone(t.voltage) },
  ] as const;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <ConnectBanner />
      <section
        className={cn(
          "cluster-stage relative grid min-h-0 flex-1 grid-cols-2 items-center gap-2 rounded-xl bg-surface px-2 py-2 sm:px-4",
          mil && "is-hot",
        )}
      >
        <ArcGauge
          value={speedVal}
          min={0}
          max={units === "us" ? 140 : 220}
          display={speed}
          label="Speed"
          unit={units === "us" ? "mph" : "km/h"}
        />
        <ArcGauge
          value={t.rpm}
          min={0}
          max={VEHICLE.redline}
          display={rpm}
          label="RPM"
          unit="rpm"
          warnFrom={VEHICLE.redline - 900}
          faultFrom={VEHICLE.redline - 400}
        />
        <div className="col-span-2 flex items-center justify-center gap-1 px-8">
          {Array.from({ length: 10 }).map((_, i) => {
            const on = t.rpm > 1200 + i * 480;
            const hot = t.rpm > VEHICLE.redline - 800;
            return (
              <span key={i} className={cn("shift-led", on && (hot ? "shift-led-hot" : "shift-led-on"))} />
            );
          })}
        </div>
      </section>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {pills.map((p) => (
          <div key={p.label} className="rounded-md bg-surface px-2 py-2 text-center shadow-[var(--shadow-border)]">
            <div className="text-cluster uppercase text-subtle">{p.label}</div>
            <div
              className={cn(
                "font-mono text-lg tabular-nums sm:text-xl",
                "tone" in p && p.tone === "ok" && "text-ok",
                "tone" in p && p.tone === "warn" && "text-warn",
                "tone" in p && p.tone === "fault" && "text-fault",
              )}
            >
              {p.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
