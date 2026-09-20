import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";

export function CodesView() {
  const faults = useApp((s) => s.faults);
  const mil = useApp((s) => s.telemetry.mil);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface px-5 py-5 shadow-[var(--shadow-border)]">
        <div className="text-cluster uppercase text-subtle">Malfunction lamp</div>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone={mil ? "fault" : "ok"}>{mil ? "MIL ON" : "MIL OFF"}</Badge>
          <span className="text-sm text-muted">
            {faults.length ? `${faults.length} stored` : "No stored codes in this session"}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted">
          Kindle Fire cannot pull live DTCs over BLE. Log codes from the Autophix 7610 on the 7610
          tab, or pair a BLE ELM327 from Chrome on a phone.
        </p>
      </section>
      {faults.length ? (
        <ul className="flex flex-col gap-2">
          {faults.map((f) => (
            <li key={f.code} className="flex items-center justify-between rounded-lg bg-surface px-3 py-3">
              <div>
                <div className="font-mono text-lg">{f.code}</div>
                <div className="text-xs text-muted">{f.module}</div>
              </div>
              <Badge tone={f.status === "stored" ? "fault" : "warn"}>{f.status}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
