import { ConnectBanner } from "@/components/cluster/connect-guide";
import { ArcGauge } from "@/components/cluster/arc-gauge";
import { BoostRpmStrip } from "@/components/cluster/boost-rpm-strip";
import { formatNum, formatPid, instantMpg, pidValue, tempTone, voltTone } from "@/lib/obd/format";
import { boostPsi } from "@/lib/obd/types";
import { useApp } from "@/lib/store";
import { DRIVE_TYPE_DEFS, DRIVE_TYPES } from "@/lib/taos/drive-types";
import { VEHICLE } from "@/lib/taos/specs";
import { cn } from "@/lib/utils";

export function DriveView() {
  const t = useApp((s) => s.telemetry);
  const history = useApp((s) => s.history);
  const units = useApp((s) => s.units);
  const driveType = useApp((s) => s.driveType);
  const setDriveType = useApp((s) => s.setDriveType);
  const def = DRIVE_TYPE_DEFS[driveType];
  const mil = t.mil;
  const speed = formatPid("speed", t, units);
  const rpm = formatPid("rpm", t, units);
  const boost = formatPid("boost", t, units);
  const mpg = formatNum(instantMpg(t), 1);
  const speedVal = units === "us" ? t.speedKmh * 0.621371 : t.speedKmh;
  const boostVal = pidValue("boost", t, units);
  const liveBoost = t.mapKpa !== t.baroKpa || t.rpm > 0;

  const pillMap = {
    gear: { label: "Gear", value: String(t.gear) },
    boost: { label: "MAP", value: `${Math.round(t.mapKpa)}`, unit: "kPa" },
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
        <span className="ml-auto hidden font-mono text-xs text-muted sm:inline">
          MAP {Math.round(t.mapKpa)} / BARO {Math.round(t.baroKpa)} kPa
          {liveBoost ? " · live" : ""}
        </span>
      </div>
      <section
        className={cn(
          "cluster-stage relative grid min-h-0 flex-1 grid-cols-[1fr_minmax(6.5rem,0.55fr)_1fr] items-center gap-1 rounded-xl bg-surface px-2 py-2 sm:px-4",
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
          className="scale-[0.82]"
          value={boostVal}
          min={units === "us" ? -8 : -0.55}
          max={units === "us" ? 20 : 1.4}
          display={boost}
          label="Boost"
          unit={units === "us" ? "psi" : "bar"}
          warnFrom={units === "us" ? 14 : 1.0}
          faultFrom={units === "us" ? 18 : 1.25}
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
        <div className="col-span-3 flex items-center justify-center gap-1 px-8">
          {Array.from({ length: 10 }).map((_, i) => {
            const on = t.rpm > 1200 + i * 480;
            const hot = t.rpm > VEHICLE.redline - def.rpmFaultPad - 200;
            const charged = boostPsi(t) > 4 && i > 5;
            return (
              <span
                key={i}
                className={cn("shift-led", on && (hot ? "shift-led-hot" : charged ? "shift-led-on" : "shift-led-on"))}
              />
            );
          })}
        </div>
        <BoostRpmStrip telemetry={t} history={history} units={units} />
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
