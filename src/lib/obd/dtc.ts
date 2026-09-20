export type DtcStatus = "stored" | "pending" | "permanent" | "cleared";

export const SAMPLE_FAULTS = [
  { code: "P2080", status: "stored" as const, module: "01 Engine" },
];
