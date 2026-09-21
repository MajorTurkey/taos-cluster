import { parsePidBytes, POLL_PIDS } from "./pids";
import { boostPsi, emptyTelemetry, type HistoryPoint, type Telemetry } from "./types";

const FFF0 = "0000fff0-0000-1000-8000-00805f9b34fb";
const FFE0 = "0000ffe0-0000-1000-8000-00805f9b34fb";
const NUS = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const ISSC = "49535343-fe7d-4ae5-8fa9-9fafd205e455";

export const ELM_OPTIONAL_SERVICES = [FFF0, FFE0, NUS, ISSC];

const PID_FIELD: Record<string, keyof Telemetry> = {
  "0C": "rpm",
  "0D": "speedKmh",
  "04": "load",
  "11": "throttle",
  "49": "accel",
  "0E": "timing",
  "05": "coolantC",
  "0F": "iatC",
  "46": "ambientC",
  "5C": "oilTempC",
  "0B": "mapKpa",
  "33": "baroKpa",
  "10": "mafGps",
  "06": "stft",
  "07": "ltft",
  "2F": "fuelPct",
  "5E": "fuelRateLph",
  "44": "equiv",
  "42": "voltage",
  "1F": "runtimeSec",
};

const FAST_PIDS = ["0C", "0D", "04", "11", "0B", "42", "05", "06", "0F", "10", "33", "2F"];

function encoder() {
  return new TextEncoder();
}

function decoder() {
  return new TextDecoder();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function applyPid(t: Telemetry, pid: string, value: number): Telemetry {
  const field = PID_FIELD[pid];
  if (!field) return t;
  const next = { ...t, [field]: value };
  if (pid === "0C") next.rpm = Math.round(value);
  if (pid === "0D") next.speedKmh = Math.round(value);
  return next;
}

export function parseElmPayload(text: string): { pid: string; value: number }[] {
  const out: { pid: string; value: number }[] = [];
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/SEARCHING\.\.\./gi, "")
    .replace(/>/g, "")
    .toUpperCase();
  for (const line of cleaned.split("\n")) {
    const hex = line.replace(/[^0-9A-F]/g, "");
    if (hex.length < 6) continue;
    if (hex.startsWith("41") || hex.startsWith("42")) {
      const pid = hex.slice(2, 4);
      const a = Number.parseInt(hex.slice(4, 6), 16);
      const b = hex.length >= 8 ? Number.parseInt(hex.slice(6, 8), 16) : 0;
      if (Number.isNaN(a)) continue;
      const value = parsePidBytes(pid, a, Number.isNaN(b) ? 0 : b);
      if (value != null) out.push({ pid, value });
    }
  }
  return out;
}

async function findUart(server: BluetoothRemoteGATTServer): Promise<{
  write: BluetoothRemoteGATTCharacteristic;
  notify: BluetoothRemoteGATTCharacteristic;
}> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const chars = await service.getCharacteristics();
    const notify = chars.find((c) => c.properties.notify || c.properties.indicate);
    const write = chars.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    );
    if (notify && write) return { write, notify };
  }
  try {
    const nus = await server.getPrimaryService(NUS);
    return {
      write: await nus.getCharacteristic(NUS_RX),
      notify: await nus.getCharacteristic(NUS_TX),
    };
  } catch {
    // fall through
  }
  throw new Error("No writable/notify UART on this adapter. Need BLE ELM or OBDLink CX.");
}

export class ElmSession {
  device: BluetoothDevice;
  private write: BluetoothRemoteGATTCharacteristic | null = null;
  private notify: BluetoothRemoteGATTCharacteristic | null = null;
  private buf = "";
  private waiter: ((s: string) => void) | null = null;
  private pollTimer: number | null = null;
  private onChunk: ((s: string) => void) | null = null;
  stopped = false;

  constructor(device: BluetoothDevice) {
    this.device = device;
  }

  async start() {
    const server = await this.device.gatt?.connect();
    if (!server) throw new Error("GATT connect failed");
    const uart = await findUart(server);
    this.write = uart.write;
    this.notify = uart.notify;
    this.notify.addEventListener("characteristicvaluechanged", this.onNotify);
    await this.notify.startNotifications();
    await this.command("ATZ", 2000);
    await sleep(200);
    await this.command("ATE0", 800);
    await this.command("ATL0", 800);
    await this.command("ATS0", 800);
    await this.command("ATH0", 800);
    await this.command("ATAT1", 800);
    await this.command("ATSP0", 1500);
    const probe = await this.command("0100", 2500);
    if (/UNABLE|ERROR|\?/i.test(probe) && !/41/.test(probe)) {
      throw new Error("Adapter answered but the ECU did not. Key on, 7610 unplugged.");
    }
  }

  private onNotify = (ev: Event) => {
    const target = ev.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;
    this.buf += decoder().decode(value);
    this.onChunk?.(this.buf);
    if (this.buf.includes(">") && this.waiter) {
      const done = this.buf;
      this.buf = "";
      const w = this.waiter;
      this.waiter = null;
      w(done);
    }
  };

  async command(cmd: string, timeoutMs = 1200): Promise<string> {
    if (!this.write) throw new Error("Not connected");
    this.buf = "";
    const payload = encoder().encode(`${cmd}\r`);
    const reply = new Promise<string>((resolve, reject) => {
      const t = window.setTimeout(() => {
        this.waiter = null;
        resolve(this.buf || "");
      }, timeoutMs);
      this.waiter = (s) => {
        window.clearTimeout(t);
        resolve(s);
      };
    });
    try {
      await this.write.writeValueWithoutResponse(payload);
    } catch {
      await this.write.writeValue(payload);
    }
    return reply;
  }

  startPolling(apply: (next: Telemetry, live: boolean) => void) {
    let telemetry = emptyTelemetry();
    let live = false;
    let i = 0;
    const tick = async () => {
      if (this.stopped) return;
      const pid = FAST_PIDS[i % FAST_PIDS.length];
      i += 1;
      try {
        const raw = await this.command(`01${pid}`, 900);
        const parsed = parseElmPayload(raw);
        if (parsed.length) {
          live = true;
          for (const p of parsed) telemetry = applyPid(telemetry, p.pid, p.value);
          apply(telemetry, true);
        } else if (!live) {
          apply(telemetry, false);
        }
      } catch {
        // keep last good frame
      }
      if (!this.stopped) this.pollTimer = window.setTimeout(() => void tick(), 40);
    };
    void tick();
  }

  historyPoint(t: Telemetry): HistoryPoint {
    return {
      t: Date.now(),
      rpm: t.rpm,
      speedKmh: t.speedKmh,
      boostPsi: boostPsi(t),
      coolantC: t.coolantC,
      stft: t.stft,
      voltage: t.voltage,
    };
  }

  stop() {
    this.stopped = true;
    if (this.pollTimer) window.clearTimeout(this.pollTimer);
    try {
      this.notify?.removeEventListener("characteristicvaluechanged", this.onNotify);
    } catch {
      // ignore
    }
    try {
      this.device.gatt?.disconnect();
    } catch {
      // ignore
    }
  }
}

export async function requestElmDevice(): Promise<BluetoothDevice> {
  if (!navigator.bluetooth) {
    throw new Error(
      "This browser has no Web Bluetooth. Stay on Demo, or open Chrome on a phone/Android tablet.",
    );
  }
  return navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ELM_OPTIONAL_SERVICES,
  });
}

void POLL_PIDS;
