export const DRIVE_TYPES = ["street", "sport", "eco", "tow", "offroad"] as const;
export type DriveType = (typeof DRIVE_TYPES)[number];

export interface DriveTypeDef {
  id: DriveType;
  label: string;
  short: string;
  hint: string;
  accent: string;
  pills: Array<"gear" | "boost" | "mpg" | "load" | "cool" | "oil" | "atf" | "batt" | "iat" | "throttle">;
  rpmWarnPad: number;
  rpmFaultPad: number;
}

export const DRIVE_TYPE_DEFS: Record<DriveType, DriveTypeDef> = {
  street: {
    id: "street",
    label: "Street",
    short: "STR",
    hint: "Daily neon dash — speed + RPM, temps, boost.",
    accent: "#39f6ff",
    pills: ["gear", "boost", "mpg", "load", "cool", "oil", "atf", "batt"],
    rpmWarnPad: 900,
    rpmFaultPad: 400,
  },
  sport: {
    id: "sport",
    label: "Sport",
    short: "SPT",
    hint: "Hot shift lights, earlier redline warn, boost and throttle up front.",
    accent: "#ff2bd6",
    pills: ["gear", "boost", "throttle", "load", "oil", "atf", "cool", "batt"],
    rpmWarnPad: 1400,
    rpmFaultPad: 600,
  },
  eco: {
    id: "eco",
    label: "Eco",
    short: "ECO",
    hint: "Fuel first. Soft cyan, MPG and load dominate.",
    accent: "#5cff9a",
    pills: ["mpg", "load", "throttle", "gear", "cool", "iat", "batt", "boost"],
    rpmWarnPad: 1800,
    rpmFaultPad: 800,
  },
  tow: {
    id: "tow",
    label: "Tow",
    short: "TOW",
    hint: "Temps and voltage for heat and charging under load.",
    accent: "#ffb020",
    pills: ["cool", "oil", "atf", "batt", "load", "boost", "gear", "mpg"],
    rpmWarnPad: 1100,
    rpmFaultPad: 500,
  },
  offroad: {
    id: "offroad",
    label: "Off-road",
    short: "OFF",
    hint: "Low-speed crawl: throttle, load, oil, battery.",
    accent: "#c8ff3a",
    pills: ["throttle", "load", "oil", "batt", "cool", "atf", "gear", "boost"],
    rpmWarnPad: 2000,
    rpmFaultPad: 900,
  },
};
