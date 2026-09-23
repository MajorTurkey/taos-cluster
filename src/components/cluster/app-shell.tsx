import { useEffect, useState } from "react";
import { CodesView } from "@/components/cluster/codes-view";
import { DriveView } from "@/components/cluster/drive-view";
import { LiveView } from "@/components/cluster/live-view";
import { ScannerView } from "@/components/cluster/scanner-view";
import { SetupPanel } from "@/components/cluster/setup-panel";
import { SystemsView } from "@/components/cluster/systems-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startRuntime, useApp } from "@/lib/store";
import { DRIVE_TYPE_DEFS } from "@/lib/taos/drive-types";
import type { ViewId } from "@/lib/obd/types";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";

const NAV: { id: ViewId; label: string }[] = [
  { id: "drive", label: "Drive" },
  { id: "systems", label: "Systems" },
  { id: "live", label: "Live" },
  { id: "codes", label: "Faults" },
  { id: "service", label: "7610" },
];

export function AppShell() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const setSetupOpen = useApp((s) => s.setSetupOpen);
  const connection = useApp((s) => s.connection);
  const mil = useApp((s) => s.telemetry.mil);
  const clock = useApp((s) => s.clock);
  const dimmer = useApp((s) => s.dimmer);
  const driveType = useApp((s) => s.driveType);
  const accent = DRIVE_TYPE_DEFS[driveType].accent;

  const [dash, setDash] = useState(false);

  useEffect(() => startRuntime(), []);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", accent);
  }, [accent]);

  useEffect(() => {
    const sync = () => {
      setDash(
        Boolean(document.fullscreenElement) ||
          window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone === true,
      );
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2 border-b border-line/80 bg-bg/80 px-3 backdrop-blur-sm sm:gap-3 sm:px-5",
          dash ? "py-1 pt-[max(0.25rem,env(safe-area-inset-top))]" : "py-2 pt-[max(0.5rem,env(safe-area-inset-top))]",
        )}
      >
        {dash ? null : (
          <div className="min-w-24">
            <div className="text-cluster uppercase text-subtle">Taos</div>
            <div className="text-sm font-medium tracking-[0.18em]">CLUSTER</div>
          </div>
        )}
        <nav className="flex flex-1 justify-center">
          <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "h-10 min-w-12 rounded-sm px-2.5 text-sm font-medium transition-colors duration-150 sm:min-w-16 sm:px-3",
                  view === item.id ? "bg-fg text-bg" : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-sm tabular-nums text-muted sm:inline">{clock}</span>
          <Badge tone={connection === "idle" ? "idle" : mil ? "fault" : "ok"}>
            {mil ? "MIL" : connection === "idle" ? "OFF" : "LIVE"}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setSetupOpen(true)} aria-label="Adapter and display">
            <Settings2 />
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "min-h-0 flex-1 overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-5",
          view === "drive" ? "py-2" : "overflow-y-auto py-5",
        )}
        style={{ filter: `brightness(${dimmer})` }}
      >
        {view === "drive" ? <DriveView /> : null}
        {view === "systems" ? <SystemsView /> : null}
        {view === "live" ? <LiveView /> : null}
        {view === "codes" ? <CodesView /> : null}
        {view === "service" ? <ScannerView /> : null}
      </main>
      <SetupPanel />
    </div>
  );
}
