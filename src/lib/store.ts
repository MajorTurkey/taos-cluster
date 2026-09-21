import { create } from "zustand";
import { ElmSession, requestElmDevice } from "@/lib/obd/elm-ble";
import { modulesFor } from "@/lib/taos/modules";
import { VEHICLE, type Drivetrain, type Trim } from "@/lib/taos/specs";
import {
  boostPsi,
  cruiseTelemetry,
  emptyTelemetry,
  type ConnectionMode,
  type FaultRecord,
  type HistoryPoint,
  type ModuleLive,
  type Scenario,
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
  dimmer: number;
  keepAwake: boolean;
  clock: string;
  scenario: Scenario;
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
  setDimmer: (dimmer: number) => void;
  setKeepAwake: (on: boolean) => void;
  startDemo: () => void;
  connectBluetooth: () => Promise<void>;
  disconnect: () => void;
}

let runtimeStarted = false;
let demoTimer: number | null = null;
let clockTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let elm: ElmSession | null = null;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nowClock() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function seedModules(trim: Trim, drivetrain: Drivetrain, scenario: Scenario): ModuleLive[] {
  return modulesFor(trim, drivetrain).map((mod) => ({
    address: mod.address,
    status: scenario === "p2080" && mod.address === "01" ? "fault" : "ok",
    dtcCount: scenario === "p2080" && mod.address === "01" ? 1 : 0,
  }));
}

function tickDemo(prev: Telemetry, scenario: Scenario): Telemetry {
  const base = cruiseTelemetry(scenario);
  const wobble = Math.sin(Date.now() / 900);
  return {
    ...prev,
    ...base,
    rpm: Math.round(base.rpm + wobble * 80),
    speedKmh: Math.round(base.speedKmh + wobble * 2),
    load: Math.max(8, Math.min(70, base.load + wobble * 6)),
    throttle: Math.max(8, Math.min(60, base.throttle + wobble * 4)),
    mapKpa: base.mapKpa + wobble * 4,
    voltage: +(base.voltage + wobble * 0.04).toFixed(2),
    runtimeSec: prev.runtimeSec + 0.25,
    mil: scenario === "p2080",
  };
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
  connection: "demo",
  connecting: false,
  units: "us",
  year: 2024,
  trim: "SE",
  drivetrain: "FWD",
  dimmer: 1,
  keepAwake: true,
  clock: nowClock(),
  scenario: "healthy",
  telemetry: cruiseTelemetry("healthy"),
  history: [],
  modules: seedModules("SE", "FWD", "healthy"),
  faults: [],
  lastError: null,
  adapterName: null,
  setView: (view) => set({ view }),
  setSetupOpen: (setupOpen) => set({ setupOpen }),
  setUnits: (units) => set({ units }),
  setYear: (year) => set({ year }),
  setTrim: (trim) => set({ trim, modules: seedModules(trim, get().drivetrain, get().scenario) }),
  setDrivetrain: (drivetrain) =>
    set({ drivetrain, modules: seedModules(get().trim, drivetrain, get().scenario) }),
  setDimmer: (dimmer) => set({ dimmer }),
  setKeepAwake: (keepAwake) => {
    set({ keepAwake });
    if (keepAwake) void requestWakeLock();
    else {
      void wakeLock?.release();
      wakeLock = null;
    }
  },
  startDemo: () => {
    elm?.stop();
    elm = null;
    set({
      connection: "demo",
      lastError: null,
      adapterName: null,
      telemetry: cruiseTelemetry(get().scenario),
    });
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
            connection: "demo",
            lastError: "Adapter disconnected. Back on demo.",
            adapterName: null,
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
        const s = useApp.getState();
        const point = session.historyPoint(telemetry);
        useApp.setState({
          telemetry,
          connection: live ? "bluetooth" : s.connection === "bluetooth" ? "bluetooth" : "idle",
          history: [...s.history.slice(-119), point],
        });
      });
    } catch (err) {
      elm?.stop();
      elm = null;
      set({
        connecting: false,
        connection: "demo",
        adapterName: null,
        lastError: err instanceof Error ? err.message : "Bluetooth pairing cancelled",
      });
    }
  },
  disconnect: () => {
    elm?.stop();
    elm = null;
    set({ connection: "demo", adapterName: null });
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

  demoTimer = window.setInterval(() => {
    const s = useApp.getState();
    if (s.connection !== "demo") return;
    const next = tickDemo(s.telemetry, s.scenario);
    const point: HistoryPoint = {
      t: Date.now(),
      rpm: next.rpm,
      speedKmh: next.speedKmh,
      boostPsi: boostPsi(next),
      coolantC: next.coolantC,
      stft: next.stft,
      voltage: next.voltage,
    };
    useApp.setState({
      telemetry: next,
      history: [...s.history.slice(-119), point],
    });
  }, 250);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && useApp.getState().keepAwake) {
      void requestWakeLock();
    }
  });

  return () => {
    if (demoTimer) window.clearInterval(demoTimer);
    if (clockTimer) window.clearInterval(clockTimer);
    runtimeStarted = false;
  };
}

export { VEHICLE };
