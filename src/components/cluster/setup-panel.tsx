import { ConnectGuide } from "@/components/cluster/connect-guide";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
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
  const dimmer = useApp((s) => s.dimmer);
  const setDimmer = useApp((s) => s.setDimmer);
  const keepAwake = useApp((s) => s.keepAwake);
  const setKeepAwake = useApp((s) => s.setKeepAwake);
  const lastError = useApp((s) => s.lastError);
  const startDemo = useApp((s) => s.startDemo);

  const goFullscreen = () => {
    const el = document.documentElement;
    void el.requestFullscreen?.();
  };

  return (
    <Dialog open={open} onOpenChange={setSetupOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>Adapter and display</DialogTitle>
        <DialogDescription>
          Kindle Fire 12th gen runs this as a night dash. Silk has no Web Bluetooth — demo works on
          the tablet; live ELM327 needs Chrome + BLE on another device.
        </DialogDescription>
        {lastError ? <p className="mt-3 text-sm text-fault">{lastError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void useApp.getState().connectBluetooth()}>Pair BLE ELM327</Button>
          <Button variant="outline" onClick={startDemo}>
            Demo cluster
          </Button>
          <Button variant="outline" onClick={goFullscreen}>
            Fullscreen
          </Button>
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
            Drive
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
