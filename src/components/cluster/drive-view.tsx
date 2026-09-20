import { ConnectBanner } from "@/components/cluster/connect-guide";
import { LinearGauge } from "@/components/cluster/linear-gauge";
import { StatTile } from "@/components/cluster/stat-tile";
import { formatNum, formatPid, instantMpg, pidValue, tempTone, voltTone } from "@/lib/obd/format";
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
  const coolantTone = tempTone(t.coolantC, "coolant");
  const oilTone = tempTone(t.oilTempC, "oil");
  const vTone = voltTone(t.voltage);

  return (
    <div className="flex flex-col gap-3">
      <ConnectBanner />
      <section
        className={cn(
          "cluster-stage rounded-xl bg-surface px-4 py-6 shadow-[var(--shadow-border)] sm:px-8",
          mil && "is-hot",
        )}
      >
        <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-cluster uppercase text-subtle">Speed</div>
            <div className={cn("font-mono text-display tabular-nums", mil ? "cluster-glow-hot" : "cluster-glow")}>
              {speed}
            </div>
            <div className="text-sm text-subtle">{units === "us" ? "mph" : "km/h"}</div>
          </div>
          <div className="text-right">
            <div className="text-cluster uppercase text-subtle">RPM</div>
            <div className="font-mono text-4xl tabular-nums sm:text-5xl">{rpm}</div>
            <div className="mt-2 flex items-center justify-end gap-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const on = t.rpm > 1500 + i * 550;
                const hot = t.rpm > VEHICLE.redline - 800;
                return (
                  <span
                    key={i}
                    className={cn("shift-led", on && (hot ? "shift-led-hot" : "shift-led-on"))}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative z-[1] mt-6 hud-strip">
          <div className="hud-cell">
            <div className="text-cluster uppercase text-subtle">Gear</div>
            <div className="font-mono text-xl">{String(t.gear)}</div>
          </div>
          <div className="hud-cell">
            <div className="text-cluster uppercase text-subtle">Boost</div>
            <div className="font-mono text-xl">{boost}</div>
          </div>
          <div className="hud-cell">
            <div className="text-cluster uppercase text-subtle">{units === "us" ? "MPG" : "L/100"}</div>
            <div className="font-mono text-xl">{mpg}</div>
          </div>
          <div className="hud-cell">
            <div className="text-cluster uppercase text-subtle">Load</div>
            <div className="font-mono text-xl">{formatPid("load", t, units)}%</div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Coolant" value={formatPid("coolant", t, units)} unit={units === "us" ? "°F" : "°C"} tone={coolantTone} />
        <StatTile label="Oil" value={formatPid("oilTemp", t, units)} unit={units === "us" ? "°F" : "°C"} tone={oilTone} />
        <StatTile label="Trans" value={formatPid("transTemp", t, units)} unit={units === "us" ? "°F" : "°C"} tone={tempTone(t.transTempC, "trans")} />
        <StatTile label="Battery" value={formatPid("voltage", t, units)} unit="V" tone={vTone} />
      </div>
      <LinearGauge
        label="Boost"
        value={boostPsi(t)}
        display={boost}
        unit={units === "us" ? "psi" : "bar"}
        min={-8}
        max={20}
        warnFrom={16}
        faultFrom={18}
      />
      <LinearGauge
        label="Throttle"
        value={pidValue("throttle", t, units)}
        display={formatPid("throttle", t, units)}
        unit="%"
        min={0}
        max={100}
      />
    </div>
  );
}
