export interface ServiceJob {
  id: string;
  name: string;
  onTool: string;
  when: string;
  steps: string[];
  note: string;
}

export const AUTOPHIX = {
  name: "Autophix 7610",
  kind: "Wired handheld VCI",
  screen: "2.8 in color LCD",
  port: "Takes the OBD-II socket. Nothing else can talk to the car while it is plugged in.",
} as const;

export const TABLET_HOOKUP = [
  {
    n: "1",
    title: "The tablet has no OBD port",
    body: "None do. The Taos does — a purple 16-pin plug in the driver footwell, above the pedals. The tablet only talks Bluetooth or USB to a dongle in that plug.",
  },
  {
    n: "2",
    title: "The 7610 cannot feed this screen",
    body: "Autophix 7610 is a wired handheld with its own display. Unplug it when you want live gauges. Keep it for full-system scans and oil / battery / EPB jobs.",
  },
  {
    n: "3",
    title: "Add a BLE dongle for live gauges",
    body: "Buy a Bluetooth Low Energy ELM327 (must say BLE or 4.0+). OBDLink CX or Veepeak BLE+ work. Skip cheap “Bluetooth OBD2” sticks that are 2.0/3.0 — Chrome cannot see those.",
  },
  {
    n: "4",
    title: "Ignition on, then pair",
    body: "Dongle in the purple port. Key on. Open this app in Chrome or Edge on an Android tablet. Gear → Bluetooth ELM327 → pick the adapter. iPad Safari cannot pair.",
  },
  {
    n: "5",
    title: "Power and mount",
    body: "Landscape, 10 inch is enough. USB-C from the Taos 12 V outlet so it does not die. Gear → keep awake + fullscreen. Do not block the passenger airbag.",
  },
] as const;

export const SERVICE_JOBS: ServiceJob[] = [
  {
    id: "scan",
    name: "Full-system scan",
    onTool: "VW → Auto scan / system list",
    when: "Any warning lamp, after a repair, or a health check",
    steps: [
      "Ignition on, engine can stay off.",
      "Plug the 7610 into the purple 16-pin port in the driver footwell.",
      "Select Volkswagen, then auto-scan. Wait for every ECU to answer.",
      "Log each module here as OK or Fault. Type any code the 7610 shows.",
    ],
    note: "Taos talks UDS. Engine, 8-speed, ESC, HVAC, airbags, gateway, doors, EPS, and MIB should all appear on SE/SEL.",
  },
  {
    id: "oil",
    name: "Oil service reset",
    onTool: "Special function → Oil reset",
    when: "After oil and filter on the 1.5 TSI",
    steps: [
      "Engine off, ignition on.",
      "Confirm oil spec (VW 508 00) and mileage on the 7610.",
      "Run oil service + inspection interval reset.",
      "Cycle ignition. Cluster should drop the oil warning.",
    ],
    note: "The EA211 evo uses a wet timing belt. Fresh oil on time matters more than the reset itself.",
  },
  {
    id: "etc",
    name: "Throttle learning",
    onTool: "Special function → Throttle / ETC",
    when: "After a battery disconnect, idle surge, or throttle-body clean",
    steps: [
      "No throttle input. A/C off.",
      "Run throttle position adaptation. Do not touch the pedal.",
      "When it finishes, idle 30 seconds, then a short drive.",
    ],
    note: "If idle stays high, look for a PCV or intake leak before repeating the adaptation.",
  },
  {
    id: "bms",
    name: "Battery registration",
    onTool: "Special function → BMS / battery",
    when: "Any 12 V battery replacement",
    steps: [
      "Install the new battery. Ignition on.",
      "Register battery type (flooded / AGM) and part size on the 7610.",
      "Clear any 61 / 8C energy-management codes.",
    ],
    note: "Unregistered batteries get undercharged. Gateway 19 and battery modules 61 / 8C are the usual addresses.",
  },
  {
    id: "epb",
    name: "EPB pad service",
    onTool: "Special function → EPB",
    when: "Rear pad or caliper work",
    steps: [
      "Open EPB, choose retract / service position before spreading the pistons.",
      "Replace pads. Run close / function test.",
      "Pump the pedal, then a short reverse/forward to seat.",
    ],
    note: "Taos uses MK100 IPB. Do not lever the rear pistons back without the 7610 in service mode.",
  },
  {
    id: "sas",
    name: "Steering angle",
    onTool: "Special function → SAS",
    when: "After alignment, EPS work, or an ESC lamp",
    steps: [
      "Park on level ground, wheels straight.",
      "Run steering-angle learning. Sweep lock-to-lock if prompted.",
      "Cycle ignition. ESC lamp should clear after a short drive.",
    ],
    note: "Module 44 (EPS) and 03 (ESC) both want a valid angle. Clear codes after a successful learn.",
  },
  {
    id: "tpms",
    name: "TPMS reset",
    onTool: "Special function → TPMS",
    when: "After sensors, wheels, or a pressure warning that will not clear",
    steps: [
      "Set all four tires to the door-jamb spec.",
      "Run TPMS reset / learn on the 7610.",
      "Drive 10 minutes above 25 mph so the gateway sees live IDs.",
    ],
    note: "SEL often has indirect or direct TPMS depending on year. If the 7610 says unsupported, use the cluster menu first.",
  },
];
