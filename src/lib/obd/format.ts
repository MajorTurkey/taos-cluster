import { PIDS, type PidDef } from "./pids";
import { boostBar, boostPsi, type Telemetry, type Units } from "./types";

export function cToF(c: number): number {
  return c * 1.8 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function lToGal(l: number): number {
  return l * 0.264172;
}

export function pidValue(id: string, t: Telemetry, units: Units): number {
  switch (id) {
    case "rpm":
      return t.rpm;
    case "speed":
      return units === "us" ? kmhToMph(t.speedKmh) : t.speedKmh;
    case "load":
      return t.load;
    case "throttle":
      return t.throttle;
    case "accel":
      return t.accel;
    case "timing":
      return t.timing;
    case "coolant":
      return units === "us" ? cToF(t.coolantC) : t.coolantC;
    case "iat":
      return units === "us" ? cToF(t.iatC) : t.iatC;
    case "ambient":
      return units === "us" ? cToF(t.ambientC) : t.ambientC;
    case "oilTemp":
      return units === "us" ? cToF(t.oilTempC) : t.oilTempC;
    case "transTemp":
      return units === "us" ? cToF(t.transTempC) : t.transTempC;
    case "map":
      return t.mapKpa;
    case "baro":
      return t.baroKpa;
    case "boost":
      return units === "us" ? boostPsi(t) : boostBar(t);
    case "maf":
      return t.mafGps;
    case "stft":
      return t.stft;
    case "ltft":
      return t.ltft;
    case "fuel":
      return t.fuelPct;
    case "fuelRate":
      return units === "us" ? lToGal(t.fuelRateLph) : t.fuelRateLph;
    case "equiv":
      return t.equiv;
    case "voltage":
      return t.voltage;
    case "oilPsi":
      return units === "us" ? t.oilPsi : t.oilPsi * 6.89476;
    case "runtime":
      return t.runtimeSec;
    default:
      return 0;
  }
}

export function formatNum(n: number, digits: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPid(id: string, t: Telemetry, units: Units): string {
  const def = PIDS.find((p) => p.id === id);
  const digits = def?.digits ?? 0;
  return formatNum(pidValue(id, t, units), digits);
}

export function pidUnit(def: PidDef, units: Units): string {
  return units === "us" ? def.unitUs : def.unitMetric;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function instantMpg(t: Telemetry): number {
  const mph = kmhToMph(t.speedKmh);
  const gph = lToGal(t.fuelRateLph);
  if (gph < 0.05) return 0;
  if (mph < 0.5) return 0;
  return mph / gph;
}

export function instantL100(t: Telemetry): number {
  const kmh = t.speedKmh;
  if (kmh < 1 || t.fuelRateLph < 0.05) return 0;
  return (t.fuelRateLph / kmh) * 100;
}

export function rangeMiles(t: Telemetry, tankGal: number): number {
  const mpg = instantMpg(t);
  const galLeft = tankGal * (t.fuelPct / 100);
  if (mpg <= 0) return galLeft * 28;
  return galLeft * Math.min(42, Math.max(18, mpg));
}

export function tempTone(c: number, kind: "coolant" | "oil" | "trans"): "ok" | "warn" | "fault" {
  const hot = kind === "oil" ? 120 : kind === "trans" ? 110 : 108;
  const warn = kind === "oil" ? 110 : kind === "trans" ? 100 : 102;
  const cold = 70;
  if (c >= hot) return "fault";
  if (c >= warn) return "warn";
  if (c < cold) return "warn";
  return "ok";
}

export function voltTone(v: number): "ok" | "warn" | "fault" {
  if (v < 11.8 || v > 15.2) return "fault";
  if (v < 12.4 || v > 14.8) return "warn";
  return "ok";
}
