import { parsePidBytes, POLL_PIDS } from "./pids";
import { boostPsi, emptyTelemetry, type HistoryPoint, type Telemetry } from "./types";

const FFF0 = "0000fff0-0000-1000-8000-00805f9b34fb";
const FFF1 = "0000fff1-0000-1000-8000-00805f9b34fb";
const FFF2 = "0000fff2-0000-1000-8000-00805f9b34fb";
const FFE0 = "0000ffe0-0000-1000-8000-00805f9b34fb";
const FFE1 = "0000ffe1-0000-1000-8000-00805f9b34fb";
const NUS = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const ISSC = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
const INFO = "0000180a-0000-1000-8000-00805f9b34fb";

export const ELM_OPTIONAL_SERVICES = [FFF0, FFE0, NUS, ISSC, INFO];

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

const FAST_PIDS = ["0C", "0D", "0B", "33"];
const SLOW_PIDS = ["11", "04", "42", "05", "2F", "0F"];
const CHUNK = 20;

function encoder() {
  return new TextEncoder();
}

function decoder() {
  return new TextDecoder();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normUuid(u: string) {
  return u.replace(/[{}]/g, "").toLowerCase();
}

export function applyPid(t: Telemetry, pid: string, value: number): Telemetry {
  const field = PID_FIELD[pid];
  if (!field) return t;
  const next = { ...t, [field]: value };
  if (pid === "0C") next.rpm = Math.round(value);
  if (pid === "0D") next.speedKmh = Math.round(value);
  if (pid === "0B") next.mapKpa = value;
  if (pid === "33") next.baroKpa = value;
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

async function charPair(
  service: BluetoothRemoteGATTService,
  writeId?: string,
  notifyId?: string,
): Promise<{ write: BluetoothRemoteGATTCharacteristic; notify: BluetoothRemoteGATTCharacteristic } | null> {
  if (writeId && notifyId) {
    try {
      return {
        write: await service.getCharacteristic(writeId),
        notify: await service.getCharacteristic(notifyId),
      };
    } catch {
      // fall through to scan
    }
  }
  const chars = await service.getCharacteristics();
  const notify = chars.find((c) => c.properties.notify || c.properties.indicate);
  const write = chars.find((c) => c.properties.writeWithoutResponse || c.properties.write);
  if (notify && write) return { write, notify };
  return null;
}

async function findUart(server: BluetoothRemoteGATTServer): Promise<{
  write: BluetoothRemoteGATTCharacteristic;
  notify: BluetoothRemoteGATTCharacteristic;
}> {
  const known: Array<{ svc: string; write?: string; notify?: string }> = [
    { svc: FFF0, write: FFF2, notify: FFF1 },
    { svc: FFE0, write: FFE1, notify: FFE1 },
    { svc: NUS, write: NUS_RX, notify: NUS_TX },
    { svc: ISSC },
  ];
  for (const spec of known) {
    try {
      const service = await server.getPrimaryService(spec.svc);
      const pair = await charPair(service, spec.write, spec.notify);
      if (pair) return pair;
    } catch {
      // try next profile
    }
  }
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      if (normUuid(service.uuid).includes("180a") || normUuid(service.uuid).includes("fef5")) continue;
      const pair = await charPair(service);
      if (pair) return pair;
    }
  } catch {
    // Chrome hides services that were not listed in optionalServices
  }
  throw new Error(
    "GATT connected but no UART. Close the official OBDLink app, then pair again. Need FFF0/FFF1/FFF2.",
  );
}

async function writeChunked(char: BluetoothRemoteGATTCharacteristic, bytes: Uint8Array) {
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.slice(i, i + CHUNK);
    try {
      if (char.properties.writeWithoutResponse) await char.writeValueWithoutResponse(slice);
      else await char.writeValue(slice);
    } catch {
      await char.writeValue(slice);
    }
    if (i + CHUNK < bytes.length) await sleep(8);
  }
}

export class ElmSession {
  device: BluetoothDevice;
  private write: BluetoothRemoteGATTCharacteristic | null = null;
  private notify: BluetoothRemoteGATTCharacteristic | null = null;
  private buf = "";
  private waiter: ((s: string) => void) | null = null;
  private pollTimer: number | null = null;
  stopped = false;

  constructor(device: BluetoothDevice) {
    this.device = device;
  }

  async start() {
    const gatt = this.device.gatt;
    if (!gatt) throw new Error("No GATT on this device");
    let server: BluetoothRemoteGATTServer | null = null;
    let last: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        server = await gatt.connect();
        if (server?.connected) break;
      } catch (err) {
        last = err;
        await sleep(400 * (attempt + 1));
      }
    }
    if (!server?.connected) {
      const msg = last instanceof Error ? last.message : "GATT connect failed";
      throw new Error(
        `${msg}. Unplug/replug the CX, quit the OBDLink app, key on, then pair again.`,
      );
    }
    const uart = await findUart(server);
    this.write = uart.write;
    this.notify = uart.notify;
    this.notify.addEventListener("characteristicvaluechanged", this.onNotify);
    await this.notify.startNotifications();
    await sleep(80);
    await this.command("ATZ", 2500);
    await sleep(250);
    await this.command("ATE0", 700);
    await this.command("ATL0", 700);
    await this.command("ATS0", 700);
    await this.command("ATH0", 700);
    await this.command("ATAT2", 700);
    await this.command("ATSP6", 1000);
    const probe = await this.command("0100", 2500);
    if (/UNABLE|ERROR|BUS INIT/i.test(probe) && !/41/.test(probe)) {
      await this.command("ATSP0", 1200);
      await this.command("0100", 2500);
    }
    await this.command("0133", 800);
    await this.command("010B", 800);
  }

  private onNotify = (ev: Event) => {
    const target = ev.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;
    this.buf += decoder().decode(value);
    if (this.buf.includes(">") && this.waiter) {
      const done = this.buf;
      this.buf = "";
      const w = this.waiter;
      this.waiter = null;
      w(done);
    }
  };

  async command(cmd: string, timeoutMs = 450): Promise<string> {
    if (!this.write) throw new Error("Not connected");
    this.buf = "";
    const payload = encoder().encode(`${cmd}\r`);
    const reply = new Promise<string>((resolve) => {
      const t = window.setTimeout(() => {
        this.waiter = null;
        resolve(this.buf || "");
      }, timeoutMs);
      this.waiter = (s) => {
        window.clearTimeout(t);
        resolve(s);
      };
    });
    await writeChunked(this.write, payload);
    return reply;
  }

  startPolling(apply: (next: Telemetry, live: boolean) => void) {
    let telemetry = emptyTelemetry();
    let live = false;
    let cycle = 0;
    let pending = false;
    let raf = 0;
    const flush = (isLive: boolean) => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(() => {
        pending = false;
        apply(telemetry, isLive);
      });
    };
    const tick = async () => {
      if (this.stopped) return;
      const wantSlow = cycle % 5 === 0;
      const extra = SLOW_PIDS[Math.floor(cycle / 5) % SLOW_PIDS.length];
      const list = wantSlow ? [...FAST_PIDS, extra] : FAST_PIDS;
      cycle += 1;
      let got = false;
      for (const pid of list) {
        if (this.stopped) return;
        try {
          const raw = await this.command(`01${pid}`, 380);
          const parsed = parseElmPayload(raw);
          if (parsed.length) {
            got = true;
            live = true;
            for (const p of parsed) telemetry = applyPid(telemetry, p.pid, p.value);
          }
        } catch {
          // keep last good frame
        }
      }
      if (got || !live) flush(live);
      if (!this.stopped) this.pollTimer = window.setTimeout(() => void tick(), 16);
    };
    void tick();
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
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
      "This browser has no Web Bluetooth. Silk cannot pair. Use Chrome or Edge on Android.",
    );
  }
  try {
    return await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: "OBDLink" },
        { namePrefix: "OBD" },
        { namePrefix: "CX" },
        { namePrefix: "STN" },
        { namePrefix: "Veepeak" },
        { namePrefix: "VEEPEAK" },
        { namePrefix: "OBDBLE" },
        { services: [FFF0] },
      ],
      optionalServices: ELM_OPTIONAL_SERVICES,
    });
  } catch (err) {
    const cancelled = err instanceof Error && /cancel/i.test(err.message);
    if (cancelled) throw err;
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ELM_OPTIONAL_SERVICES,
    });
  }
}

void POLL_PIDS;
