import { ConnectBanner } from "@/components/cluster/connect-guide";
import { ArcGauge } from "@/components/cluster/arc-gauge";
import { formatNum, formatPid, instantMpg, tempTone, voltTone } from "@/lib/obd/format";
import { useApp } from "@/lib/store";
import { DRIVE_TYPE_DEFS, DRIVE_TYPES } from "@/lib/taos/drive-types";
import { VEHICLE } from "@/lib/taos/specs";
import { cn } from "@/lib/utils";

export function DriveView() {
  const t = useApp((s) => s.telemetry);
  const units = useApp((s) => s.units);
  const driveType = useApp((s) => s.driveType);
  const setDriveType = useApp((s) => s.setDriveType);
  const def = DRIVE_TYPE_DEFS[driveType];
  const mil = t.mil;
  const speed = formatPid("speed", t, units);
  const rpm = formatPid("rpm", t, units);
  const mpg = formatNum(instantMpg(t), 1);
  const speedVal = units === "us" ? t.speedKmh * 0.621371 : t.speedKmh;

  const pillMap = {
    gear: { label: "Gear", value: String(t.gear) },
    boost: { label: "Boost", value: formatPid("boost", t, units), unit: units === "us" ? "psi" : "bar" },
    mpg: { label: units === "us" ? "MPG" : "L/100", value: mpg },
    load: { label: "Load", value: `${formatPid("load", t, units)}%` },
    cool: { label: "Cool", value: formatPid("coolant", t, units), tone: tempTone(t.coolantC, "coolant") },
    oil: { label: "Oil", value: formatPid("oilTemp", t, units), tone: tempTone(t.oilTempC, "oil") },
    atf: { label: "ATF", value: formatPid("transTemp", t, units), tone: tempTone(t.transTempC, "trans") },
    batt: { label: "Batt", value: formatPid("voltage", t, units), tone: voltTone(t.voltage) },
    iat: { label: "IAT", value: formatPid("iat", t, units), tone: tempTone(t.iatC, "coolant") },
    throttle: { label: "Thr", value: `${formatPid("throttle", t, units)}%` },
  } as const;

  const pills = def.pills.map((id) => pillMap[id]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2" style={{ ["--color-accent" as string]: def.accent }}>
      <ConnectBanner />
      <div className="flex flex-wrap items-center gap-1.5">
        {DRIVE_TYPES.map((id) => {
          const item = DRIVE_TYPE_DEFS[id];
          return (
            <button
              key={id}
              type="button"
              className={cn("drive-chip", driveType === id && "is-on")}
              style={driveType === id ? { background: item.accent, boxShadow: `0 0 16px ${item.accent}` } : undefined}
              onClick={() => setDriveType(id)}
            >
              {item.short}
            </button>
          );
        })}
        <span className="ml-auto hidden text-xs text-muted sm:inline">{def.hint}</span>
      </div>
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
          warnFrom={VEHICLE.redline - def.rpmWarnPad}
          faultFrom={VEHICLE.redline - def.rpmFaultPad}
        />
        <div className="col-span-2 flex items-center justify-center gap-1 px-8">
          {Array.from({ length: 10 }).map((_, i) => {
            const on = t.rpm > 1200 + i * 480;
            const hot = t.rpm > VEHICLE.redline - def.rpmFaultPad - 200;
            return <span key={i} className={cn("shift-led", on && (hot ? "shift-led-hot" : "shift-led-on"))} />;
          })}
        </div>
      </section>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {pills.map((p) => (
          <div key={p.label} className="neon-pill px-2 py-2 text-center">
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
