import type { Drivetrain, Trim } from "./specs";

export type ModuleStatus = "idle" | "scanning" | "ok" | "fault" | "absent";

export interface EcuModule {
  address: string;
  name: string;
  short: string;
  component: string;
  partSw: string;
  partHw: string;
  asam: string;
  requires: "all" | "awd" | "sel" | "se+";
  group: "powertrain" | "chassis" | "body" | "safety" | "assist";
}

export const TAOS_MODULES: EcuModule[] = [
  { address: "01", name: "Engine", short: "ECM", component: "J623 · R4 1.5l TFS", partSw: "05E 906 013 C", partHw: "05E 907 309 BB", asam: "EV_ECM15TFS01105E906013C", requires: "all", group: "powertrain" },
  { address: "02", name: "Auto Trans", short: "TCM", component: "J217 · AQ300-8F", partSw: "09S 927 158 K", partHw: "09S 927 158 K", asam: "EV_TCMAQ300", requires: "all", group: "powertrain" },
  { address: "03", name: "ABS / ESC", short: "ESC", component: "J104 · MK100 IPB", partSw: "5Q0 614 517 GB", partHw: "5Q0 614 517 BP", asam: "EV_Brake1UDSContiMK100IPB", requires: "all", group: "chassis" },
  { address: "05", name: "Access / Start", short: "Kessy", component: "J518 · Kessy", partSw: "5Q0 959 435 N", partHw: "5Q0 959 435 N", asam: "EV_AccessStart", requires: "all", group: "body" },
  { address: "08", name: "Auto HVAC", short: "HVAC", component: "J301 · Climate", partSw: "5GM 907 426 L", partHw: "5GM 907 426 L", asam: "EV_ACManueBHBVW37X", requires: "all", group: "body" },
  { address: "09", name: "Cent. Electrics", short: "BCM", component: "J519 · Body", partSw: "5Q0 937 084 CP", partHw: "5Q0 937 084 CP", asam: "EV_BCM", requires: "all", group: "body" },
  { address: "13", name: "Auto Dist. Reg", short: "ACC", component: "J428 · Radar", partSw: "2Q0 907 572 F", partHw: "2Q0 907 572 F", asam: "EV_ACCP", requires: "sel", group: "assist" },
  { address: "15", name: "Airbags", short: "SRS", component: "J234 · Airbag", partSw: "5Q0 959 655 BK", partHw: "5Q0 959 655 BK", asam: "EV_AirbaVW37", requires: "all", group: "safety" },
  { address: "16", name: "Steering Column", short: "SCE", component: "J527 · Column", partSw: "5Q0 953 549 B", partHw: "5Q0 953 549 B", asam: "EV_SMLSVALE", requires: "all", group: "chassis" },
  { address: "17", name: "Instruments", short: "IPC", component: "J285 · Cluster", partSw: "17A 920 890", partHw: "17A 920 890", asam: "EV_DashBoardVW37", requires: "all", group: "body" },
  { address: "19", name: "CAN Gateway", short: "GW", component: "J533 · Gateway", partSw: "5Q0 907 530 AK", partHw: "5Q0 907 530 AK", asam: "EV_GatewQual", requires: "all", group: "body" },
  { address: "22", name: "AWD", short: "4Mot", component: "J492 · Coupling", partSw: "0CQ 907 554 H", partHw: "0CQ 907 554 H", asam: "EV_AWD", requires: "awd", group: "powertrain" },
  { address: "3C", name: "Lane Change", short: "SWA", component: "J769 · Side assist", partSw: "2Q0 907 566 F", partHw: "2Q0 907 566 F", asam: "EV_LaneChange", requires: "sel", group: "assist" },
  { address: "42", name: "Door Elect. Driver", short: "Door L", component: "J386 · Driver door", partSw: "5Q0 959 593 K", partHw: "5Q0 959 593 K", asam: "EV_DoorDriver", requires: "all", group: "body" },
  { address: "44", name: "Steering Assist", short: "EPS", component: "J500 · EPS", partSw: "5Q0 909 144 AA", partHw: "5Q0 909 144 AA", asam: "EV_SteerAssisNSK", requires: "all", group: "chassis" },
  { address: "52", name: "Door Elect. Pass.", short: "Door R", component: "J387 · Pass door", partSw: "5Q0 959 592 K", partHw: "5Q0 959 592 K", asam: "EV_DoorPass", requires: "all", group: "body" },
  { address: "5F", name: "Information Electr.", short: "MIB", component: "J794 · MIB3", partSw: "3G5 035 820", partHw: "3G5 035 820", asam: "EV_InfoElect", requires: "all", group: "body" },
  { address: "75", name: "Telematics", short: "OCU", component: "J949 · Car-Net", partSw: "5WA 035 284", partHw: "5WA 035 284", asam: "EV_Telematic", requires: "se+", group: "assist" },
  { address: "A5", name: "Front Assist", short: "FAS", component: "J1121 · Camera", partSw: "2Q0 980 653", partHw: "2Q0 980 653", asam: "EV_FrontAssist", requires: "se+", group: "assist" },
  { address: "BB", name: "Door Rear Driver", short: "RR L", component: "J388 · Rear left", partSw: "5Q0 959 595", partHw: "5Q0 959 595", asam: "EV_DoorRearDr", requires: "all", group: "body" },
  { address: "BC", name: "Door Rear Pass.", short: "RR R", component: "J389 · Rear right", partSw: "5Q0 959 594", partHw: "5Q0 959 594", asam: "EV_DoorRearPa", requires: "all", group: "body" },
  { address: "CA", name: "Sunroof", short: "Roof", component: "J245 · Sliding roof", partSw: "5Q0 959 591", partHw: "5Q0 959 591", asam: "EV_Sunroof", requires: "sel", group: "body" },
];

export function modulesFor(trim: Trim, drivetrain: Drivetrain): EcuModule[] {
  return TAOS_MODULES.filter((mod) => {
    if (mod.requires === "all") return true;
    if (mod.requires === "awd") return drivetrain === "4Motion";
    if (mod.requires === "sel") return trim === "SEL";
    if (mod.requires === "se+") return trim === "SE" || trim === "SEL";
    return true;
  });
}

export const GROUP_LABEL: Record<EcuModule["group"], string> = {
  powertrain: "Powertrain",
  chassis: "Chassis",
  body: "Body & cabin",
  safety: "Safety",
  assist: "Driver assist",
};
