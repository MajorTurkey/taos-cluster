import type { DtcStatus } from "./dtc";
import type { ModuleStatus } from "@/lib/taos/modules";

export type Units = "us" | "metric";
export type ViewId = "drive" | "systems" | "live" | "codes" | "service";
export type ConnectionMode = "idle" | "demo" | "bluetooth" | "serial";
export type Scenario = "healthy" | "p2080";

export interface Telemetry {
  rpm: number;
  speedKmh: number;
  load: number;
  throttle: number;
  accel: number;
  timing: number;
  coolantC: number;
  iatC: number;
  ambientC: number;
  oilTempC: number;
  transTempC: number;
  mapKpa: number;
  baroKpa: number;
  mafGps: number;
  stft: number;
  ltft: number;
  fuelPct: number;
  fuelRateLph: number;
  equiv: number;
  voltage: number;
  oilPsi: number;
  runtimeSec: number;
  mil: boolean;
  gear: number | "P" | "R" | "N";
  driveMode: "D" | "S" | "P" | "R" | "N";
}

export interface HistoryPoint {
  t: number;
  rpm: number;
  speedKmh: number;
  boostPsi: number;
  coolantC: number;
  stft: number;
  voltage: number;
}

export interface ModuleLive {
  address: string;
  status: ModuleStatus;
  dtcCount: number;
}

export interface FaultRecord {
  code: string;
  status: DtcStatus;
  module: string;
}

export function cruiseTelemetry(scenario: Scenario = "healthy"): Telemetry {
  return {
    rpm: 2100,
    speedKmh: 108,
    load: 32,
    throttle: 26,
    accel: 24,
    timing: 12,
    coolantC: 91,
    iatC: 24,
    ambientC: 18,
    oilTempC: 96,
    transTempC: 78,
    mapKpa: 119,
    baroKpa: 101,
    mafGps: 12,
    stft: 0.4,
    ltft: 0.6,
    fuelPct: 62,
    fuelRateLph: 3.2,
    equiv: 1,
    voltage: 13.95,
    oilPsi: 28,
    runtimeSec: 140,
    mil: scenario === "p2080",
    gear: 7,
    driveMode: "D",
  };
}

export function emptyTelemetry(): Telemetry {
  return {
    rpm: 0,
    speedKmh: 0,
    load: 0,
    throttle: 0,
    accel: 0,
    timing: 0,
    coolantC: 18,
    iatC: 18,
    ambientC: 18,
    oilTempC: 18,
    transTempC: 18,
    mapKpa: 99,
    baroKpa: 101,
    mafGps: 0,
    stft: 0,
    ltft: 0.4,
    fuelPct: 62,
    fuelRateLph: 0,
    equiv: 1,
    voltage: 12.4,
    oilPsi: 0,
    runtimeSec: 0,
    mil: false,
    gear: "P",
    driveMode: "P",
  };
}

export function boostPsi(t: Telemetry): number {
  return (t.mapKpa - t.baroKpa) * 0.145038;
}

export function boostBar(t: Telemetry): number {
  return (t.mapKpa - t.baroKpa) / 100;
}
