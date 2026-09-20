import { LinearGauge } from "@/components/cluster/linear-gauge";
import { formatPid, pidUnit, pidValue } from "@/lib/obd/format";
import { GROUP_LABEL, GROUP_ORDER, PIDS } from "@/lib/obd/pids";
import { useApp } from "@/lib/store";

export function LiveView() {
  const t = useApp((s) => s.telemetry);
  const units = useApp((s) => s.units);

  return (
    <div className="flex flex-col gap-6">
      {GROUP_ORDER.map((group) => {
        const rows = PIDS.filter((p) => p.group === group);
        return (
          <section key={group}>
            <h2 className="mb-2 text-cluster uppercase text-subtle">{GROUP_LABEL[group]}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {rows.map((pid) => (
                <LinearGauge
                  key={pid.id}
                  label={pid.short}
                  value={pidValue(pid.id, t, units)}
                  display={formatPid(pid.id, t, units)}
                  unit={pidUnit(pid, units)}
                  min={pid.min}
                  max={pid.max}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
