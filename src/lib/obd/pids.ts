export interface PidDef {
  id: string;
  mode: string;
  pid: string;
  name: string;
  short: string;
  unitMetric: string;
  unitUs: string;
  digits: number;
  min: number;
  max: number;
  group: "engine" | "fuel" | "temps" | "air" | "electrical" | "emissions";
  source: "obd" | "vw";
}

export const PIDS: PidDef[] = [
  { id: "rpm", mode: "01", pid: "0C", name: "Engine RPM", short: "RPM", unitMetric: "rpm", unitUs: "rpm", digits: 0, min: 0, max: 7000, group: "engine", source: "obd" },
  { id: "speed", mode: "01", pid: "0D", name: "Vehicle speed", short: "SPD", unitMetric: "km/h", unitUs: "mph", digits: 0, min: 0, max: 140, group: "engine", source: "obd" },
  { id: "load", mode: "01", pid: "04", name: "Calculated load", short: "LOAD", unitMetric: "%", unitUs: "%", digits: 0, min: 0, max: 100, group: "engine", source: "obd" },
  { id: "throttle", mode: "01", pid: "11", name: "Throttle position", short: "TPS", unitMetric: "%", unitUs: "%", digits: 0, min: 0, max: 100, group: "engine", source: "obd" },
  { id: "accel", mode: "01", pid: "49", name: "Accelerator pedal", short: "APP", unitMetric: "%", unitUs: "%", digits: 0, min: 0, max: 100, group: "engine", source: "obd" },
  { id: "timing", mode: "01", pid: "0E", name: "Timing advance", short: "SA", unitMetric: "°", unitUs: "°", digits: 1, min: -20, max: 50, group: "engine", source: "obd" },
  { id: "coolant", mode: "01", pid: "05", name: "Coolant temp", short: "ECT", unitMetric: "°C", unitUs: "°F", digits: 0, min: -20, max: 130, group: "temps", source: "obd" },
  { id: "iat", mode: "01", pid: "0F", name: "Intake air temp", short: "IAT", unitMetric: "°C", unitUs: "°F", digits: 0, min: -20, max: 80, group: "temps", source: "obd" },
  { id: "ambient", mode: "01", pid: "46", name: "Ambient air", short: "AAT", unitMetric: "°C", unitUs: "°F", digits: 0, min: -20, max: 50, group: "temps", source: "obd" },
  { id: "oilTemp", mode: "01", pid: "5C", name: "Engine oil temp", short: "EOT", unitMetric: "°C", unitUs: "°F", digits: 0, min: -20, max: 140, group: "temps", source: "obd" },
  { id: "transTemp", mode: "22", pid: "VW", name: "Transmission temp", short: "TFT", unitMetric: "°C", unitUs: "°F", digits: 0, min: -20, max: 130, group: "temps", source: "vw" },
  { id: "map", mode: "01", pid: "0B", name: "Manifold pressure", short: "MAP", unitMetric: "kPa", unitUs: "kPa", digits: 0, min: 0, max: 250, group: "air", source: "obd" },
  { id: "baro", mode: "01", pid: "33", name: "Barometric pressure", short: "BARO", unitMetric: "kPa", unitUs: "kPa", digits: 0, min: 80, max: 110, group: "air", source: "obd" },
  { id: "boost", mode: "01", pid: "MAP", name: "Boost / vacuum", short: "BST", unitMetric: "bar", unitUs: "psi", digits: 1, min: -15, max: 20, group: "air", source: "obd" },
  { id: "maf", mode: "01", pid: "10", name: "Mass air flow", short: "MAF", unitMetric: "g/s", unitUs: "g/s", digits: 1, min: 0, max: 80, group: "air", source: "obd" },
  { id: "stft", mode: "01", pid: "06", name: "Short-term fuel trim", short: "STFT", unitMetric: "%", unitUs: "%", digits: 1, min: -25, max: 25, group: "fuel", source: "obd" },
  { id: "ltft", mode: "01", pid: "07", name: "Long-term fuel trim", short: "LTFT", unitMetric: "%", unitUs: "%", digits: 1, min: -25, max: 25, group: "fuel", source: "obd" },
  { id: "fuel", mode: "01", pid: "2F", name: "Fuel level", short: "FUEL", unitMetric: "%", unitUs: "%", digits: 0, min: 0, max: 100, group: "fuel", source: "obd" },
  { id: "fuelRate", mode: "01", pid: "5E", name: "Engine fuel rate", short: "FR", unitMetric: "L/h", unitUs: "gph", digits: 2, min: 0, max: 8, group: "fuel", source: "obd" },
  { id: "equiv", mode: "01", pid: "44", name: "Commanded lambda", short: "λ", unitMetric: "λ", unitUs: "λ", digits: 3, min: 0.7, max: 1.3, group: "emissions", source: "obd" },
  { id: "voltage", mode: "01", pid: "42", name: "Control module voltage", short: "VPWR", unitMetric: "V", unitUs: "V", digits: 2, min: 11, max: 15.5, group: "electrical", source: "obd" },
  { id: "oilPsi", mode: "22", pid: "VW", name: "Oil pressure", short: "EOP", unitMetric: "kPa", unitUs: "psi", digits: 0, min: 0, max: 80, group: "engine", source: "vw" },
  { id: "runtime", mode: "01", pid: "1F", name: "Run time", short: "RNT", unitMetric: "s", unitUs: "s", digits: 0, min: 0, max: 86400, group: "engine", source: "obd" },
];

export const POLL_PIDS = PIDS.filter((p) => p.source === "obd" && p.pid.length === 2);

export function parsePidBytes(pid: string, a: number, b = 0): number | null {
  switch (pid) {
    case "0C":
      return ((a * 256 + b) / 4);
    case "0D":
      return a;
    case "04":
    case "11":
    case "49":
    case "2F":
      return (a * 100) / 255;
    case "05":
    case "0F":
    case "46":
    case "5C":
      return a - 40;
    case "0E":
      return (a - 128) / 2;
    case "0B":
    case "33":
      return a;
    case "10":
      return (a * 256 + b) / 100;
    case "06":
    case "07":
      return ((a - 128) * 100) / 128;
    case "5E":
      return (a * 256 + b) / 20;
    case "44":
      return (a * 256 + b) / 32768;
    case "42":
      return (a * 256 + b) / 1000;
    case "1F":
      return a * 256 + b;
    default:
      return null;
  }
}

export const GROUP_ORDER = ["engine", "air", "temps", "fuel", "emissions", "electrical"] as const;
export const GROUP_LABEL: Record<(typeof GROUP_ORDER)[number], string> = {
  engine: "Engine",
  air: "Air & boost",
  temps: "Temperatures",
  fuel: "Fuel",
  emissions: "Lambda",
  electrical: "Electrical",
};
