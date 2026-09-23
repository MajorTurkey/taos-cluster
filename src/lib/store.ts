import { create } from "zustand";
import { ElmSession, requestElmDevice } from "@/lib/obd/elm-ble";
import { modulesFor } from "@/lib/taos/modules";
import { VEHICLE, type Drivetrain, type Trim } from "@/lib/taos/specs";
import { type DriveType } from "@/lib/taos/drive-types";
import {
  emptyTelemetry,
  type ConnectionMode,
  type FaultRecord,
  type HistoryPoint,
  type ModuleLive,
  type Telemetry,
  type Units,
  type ViewId,
} from "@/lib/obd/types";

interface AppState {
  view: ViewId;
  setupOpen: boolean;
  connection: ConnectionMode;
  connecting: boolean;
  units: Units;
  year: number;
  trim: Trim;
  drivetrain: Drivetrain;
  driveType: DriveType;
  dimmer: number;
  keepAwake: boolean;
  clock: string;
  telemetry: Telemetry;
  history: HistoryPoint[];
  modules: ModuleLive[];
  faults: FaultRecord[];
  lastError: string | null;
  adapterName: string | null;
  setView: (view: ViewId) => void;
  setSetupOpen: (open: boolean) => void;
  setUnits: (units: Units) => void;
  setYear: (year: number) => void;
  setTrim: (trim: Trim) => void;
  setDrivetrain: (drivetrain: Drivetrain) => void;
  setDriveType: (driveType: DriveType) => void;
  setDimmer: (dimmer: number) => void;
  setKeepAwake: (on: boolean) => void;
  connectBluetooth: () => Promise<void>;
  disconnect: () => void;
}

let runtimeStarted = false;
let clockTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let elm: ElmSession | null = null;
let lastHistoryAt = 0;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nowClock() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function seedModules(trim: Trim, drivetrain: Drivetrain): ModuleLive[] {
  return modulesFor(trim, drivetrain).map((mod) => ({
    address: mod.address,
    status: "ok" as const,
    dtcCount: 0,
  }));
}

async function requestWakeLock() {
  try {
    wakeLock = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    wakeLock = null;
  }
}

export const useApp = create<AppState>((set, get) => ({
  view: "drive",
  setupOpen: false,
  connection: "idle",
  connecting: false,
  units: "us",
  year: 2024,
  trim: "SE",
  drivetrain: "FWD",
  driveType: "street",
  dimmer: 1,
  keepAwake: true,
  clock: nowClock(),
  telemetry: emptyTelemetry(),
  history: [],
  modules: seedModules("SE", "FWD"),
  faults: [],
  lastError: null,
  adapterName: null,
  setView: (view) => set({ view }),
  setSetupOpen: (setupOpen) => set({ setupOpen }),
  setUnits: (units) => set({ units }),
  setYear: (year) => set({ year }),
  setTrim: (trim) => set({ trim, modules: seedModules(trim, get().drivetrain) }),
  setDrivetrain: (drivetrain) => set({ drivetrain, modules: seedModules(get().trim, drivetrain) }),
  setDriveType: (driveType) => set({ driveType }),
  setDimmer: (dimmer) => set({ dimmer }),
  setKeepAwake: (keepAwake) => {
    set({ keepAwake });
    if (keepAwake) void requestWakeLock();
    else {
      void wakeLock?.release();
      wakeLock = null;
    }
  },
  connectBluetooth: async () => {
    set({ connecting: true, lastError: null });
    try {
      const device = await requestElmDevice();
      elm?.stop();
      const session = new ElmSession(device);
      elm = session;
      device.addEventListener("gattserverdisconnected", () => {
        if (elm === session) {
          session.stop();
          elm = null;
          useApp.setState({
            connection: "idle",
            lastError: "Adapter disconnected.",
            adapterName: null,
            telemetry: emptyTelemetry(),
          });
        }
      });
      await session.start();
      set({
        connection: "idle",
        connecting: false,
        adapterName: device.name ?? "BLE adapter",
        telemetry: emptyTelemetry(),
        lastError: null,
      });
      session.startPolling((telemetry, live) => {
        const now = Date.now();
        const patch: Partial<AppState> = {
          telemetry,
          connection: live ? "bluetooth" : useApp.getState().connection,
        };
        if (now - lastHistoryAt > 400) {
          lastHistoryAt = now;
          const s = useApp.getState();
          patch.history = [...s.history.slice(-59), session.historyPoint(telemetry)];
        }
        useApp.setState(patch);
      });
    } catch (err) {
      elm?.stop();
      elm = null;
      set({
        connecting: false,
        connection: "idle",
        adapterName: null,
        lastError: err instanceof Error ? err.message : "Bluetooth pairing cancelled",
      });
    }
  },
  disconnect: () => {
    elm?.stop();
    elm = null;
    set({ connection: "idle", adapterName: null, telemetry: emptyTelemetry() });
  },
}));

export function startRuntime() {
  if (runtimeStarted || typeof window === "undefined") return () => {};
  runtimeStarted = true;
  const store = useApp.getState();
  if (store.keepAwake) void requestWakeLock();

  clockTimer = window.setInterval(() => {
    useApp.setState({ clock: nowClock() });
  }, 15_000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && useApp.getState().keepAwake) {
      void requestWakeLock();
    }
  });

  return () => {
    if (clockTimer) window.clearInterval(clockTimer);
    runtimeStarted = false;
  };
}

export { VEHICLE };
