import { ConnectGuide } from "@/components/cluster/connect-guide";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { DRIVE_TYPE_DEFS, DRIVE_TYPES } from "@/lib/taos/drive-types";
import { DRIVETRAINS, TRIMS, YEARS } from "@/lib/taos/specs";

export function SetupPanel() {
  const open = useApp((s) => s.setupOpen);
  const setSetupOpen = useApp((s) => s.setSetupOpen);
  const units = useApp((s) => s.units);
  const setUnits = useApp((s) => s.setUnits);
  const year = useApp((s) => s.year);
  const setYear = useApp((s) => s.setYear);
  const trim = useApp((s) => s.trim);
  const setTrim = useApp((s) => s.setTrim);
  const drivetrain = useApp((s) => s.drivetrain);
  const setDrivetrain = useApp((s) => s.setDrivetrain);
  const driveType = useApp((s) => s.driveType);
  const setDriveType = useApp((s) => s.setDriveType);
  const dimmer = useApp((s) => s.dimmer);
  const setDimmer = useApp((s) => s.setDimmer);
  const keepAwake = useApp((s) => s.keepAwake);
  const setKeepAwake = useApp((s) => s.setKeepAwake);
  const lastError = useApp((s) => s.lastError);
  const disconnect = useApp((s) => s.disconnect);
  const connecting = useApp((s) => s.connecting);
  const connection = useApp((s) => s.connection);
  const adapterName = useApp((s) => s.adapterName);

  const goFullscreen = () => {
    const el = document.documentElement;
    void el.requestFullscreen?.();
  };

  return (
    <Dialog open={open} onOpenChange={setSetupOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>Adapter and display</DialogTitle>
        <DialogDescription>
          Live cluster only. Pair a BLE ELM327 / OBDLink CX from Chrome. Silk on the Fire cannot
          talk Bluetooth — use Chrome on a phone or a tablet that has Web Bluetooth.
        </DialogDescription>
        {adapterName ? (
          <p className="mt-3 text-sm text-muted">
            {adapterName} · {connection === "bluetooth" ? "LIVE" : connecting ? "pairing" : "waiting for ECU"}
          </p>
        ) : null}
        {lastError ? <p className="mt-3 text-sm text-fault">{lastError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={connecting} onClick={() => void useApp.getState().connectBluetooth()}>
            {connecting ? "Pairing…" : "Pair BLE adapter"}
          </Button>
          <Button variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
          <Button variant="outline" onClick={goFullscreen}>
            Fullscreen
          </Button>
        </div>
        <div className="mt-4">
          <div className="text-cluster uppercase text-subtle">Drive type</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DRIVE_TYPES.map((id) => {
              const item = DRIVE_TYPE_DEFS[id];
              const on = driveType === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={on ? "drive-chip is-on" : "drive-chip"}
                  style={on ? { background: item.accent, boxShadow: `0 0 16px ${item.accent}` } : undefined}
                  onClick={() => setDriveType(id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{DRIVE_TYPE_DEFS[driveType].hint}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <label className="text-muted">
            Units
            <select
              className="mt-1 w-full rounded-md bg-raised px-2 py-2 text-fg"
              value={units}
              onChange={(e) => setUnits(e.target.value as "us" | "metric")}
            >
              <option value="us">US</option>
              <option value="metric">Metric</option>
            </select>
          </label>
          <label className="text-muted">
            Year
            <select
              className="mt-1 w-full rounded-md bg-raised px-2 py-2 text-fg"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted">
            Trim
            <select
              className="mt-1 w-full rounded-md bg-raised px-2 py-2 text-fg"
              value={trim}
              onChange={(e) => setTrim(e.target.value as typeof trim)}
            >
              {TRIMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted">
            Drivetrain
            <select
              className="mt-1 w-full rounded-md bg-raised px-2 py-2 text-fg"
              value={drivetrain}
              onChange={(e) => setDrivetrain(e.target.value as typeof drivetrain)}
            >
              {DRIVETRAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm text-muted">
          Dimmer {Math.round(dimmer * 100)}%
          <input
            type="range"
            min={0.45}
            max={1}
            step={0.01}
            value={dimmer}
            onChange={(e) => setDimmer(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keepAwake} onChange={(e) => setKeepAwake(e.target.checked)} />
          Keep screen awake
        </label>
        <div className="mt-5">
          <ConnectGuide compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
