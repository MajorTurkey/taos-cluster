import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { GROUP_LABEL, modulesFor } from "@/lib/taos/modules";

export function SystemsView() {
  const trim = useApp((s) => s.trim);
  const drivetrain = useApp((s) => s.drivetrain);
  const live = useApp((s) => s.modules);
  const mods = modulesFor(trim, drivetrain);
  const groups = ["powertrain", "chassis", "body", "safety", "assist"] as const;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const rows = mods.filter((m) => m.group === group);
        if (!rows.length) return null;
        return (
          <section key={group}>
            <h2 className="mb-2 text-cluster uppercase text-subtle">{GROUP_LABEL[group]}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((mod) => {
                const st = live.find((l) => l.address === mod.address);
                const tone =
                  st?.status === "fault" ? "fault" : st?.status === "ok" ? "ok" : "idle";
                return (
                  <article key={mod.address} className="rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs text-subtle">{mod.address}</div>
                        <div className="font-medium">{mod.name}</div>
                        <div className="text-xs text-muted">{mod.component}</div>
                      </div>
                      <Badge tone={tone}>{st?.status ?? "idle"}</Badge>
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-subtle">{mod.partSw}</div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
