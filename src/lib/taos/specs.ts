export const VEHICLE = {
  make: "Volkswagen",
  model: "Taos",
  engine: "1.5 TSI",
  engineCode: "DNKA",
  family: "EA211 evo",
  layout: "I4 turbo",
  horsepower: 158,
  torqueLbFt: 184,
  redline: 6500,
  idleRpm: 750,
  fuelGalFwd: 13.2,
  fuelGalAwd: 14.5,
  transUs: "8-speed AQ300-8F",
  transCode: "09S",
  tireDiameterIn: 26.7,
  finalDrive: 3.23,
  gearRatios: [0, 4.727, 3.143, 1.95, 1.429, 1.207, 1.0, 0.808, 0.673],
} as const;

export const YEARS = [2022, 2023, 2024, 2025, 2026] as const;
export const TRIMS = ["S", "SE", "SEL"] as const;
export const DRIVETRAINS = ["FWD", "4Motion"] as const;

export type Trim = (typeof TRIMS)[number];
export type Drivetrain = (typeof DRIVETRAINS)[number];
