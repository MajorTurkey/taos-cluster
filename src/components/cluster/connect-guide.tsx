import { Button } from "@/components/ui/button";
import { TABLET_HOOKUP } from "@/lib/taos/autophix";
import { useApp } from "@/lib/store";

export function ConnectGuide({ compact = false }: { compact?: boolean }) {
  const connectBluetooth = useApp((s) => s.connectBluetooth);
  const connecting = useApp((s) => s.connecting);

  return (
    <section className="rounded-xl bg-surface px-5 py-5 shadow-[0_0_0_1px_rgba(236,236,232,0.06)]">
      <div className="text-cluster text-subtle uppercase">Hook up this tablet</div>
      <h2 className="mt-1 text-lg font-medium tracking-tight">No OBD on the tablet — use a dongle in the car</h2>
      {!compact ? (
        <p className="mt-2 max-w-2xl text-sm leading-normal text-muted">
          This screen is the dash. The car holds the data. A small Bluetooth adapter sits in the
          Taos OBD port and this tablet reads it. The Autophix 7610 does not do that job.
        </p>
      ) : null}
      <ol className="mt-4 flex flex-col gap-3">
        {TABLET_HOOKUP.map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-xs text-accent">
              {step.n}
            </span>
            <div>
              <div className="font-medium">{step.title}</div>
              <p className="mt-1 text-sm leading-normal text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => void connectBluetooth()} disabled={connecting}>
          Pair Bluetooth dongle
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            useApp.getState().setView("service");
            useApp.getState().setSetupOpen(false);
          }}
        >
          7610 scan jobs
        </Button>
      </div>
    </section>
  );
}

export function ConnectBanner() {
  const connection = useApp((s) => s.connection);
  const setSetupOpen = useApp((s) => s.setSetupOpen);
  if (connection === "bluetooth" || connection === "serial") return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-raised px-3 py-2 shadow-[var(--shadow-border)]">
      <p className="truncate text-xs text-muted sm:text-sm">
        Demo cluster · BLE dongle in the purple OBD plug makes this live
      </p>
      <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
        Connect
      </Button>
    </div>
  );
}
