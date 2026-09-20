# TAOS CLUSTER

Tablet dash for a Volkswagen Taos (2022+, 1.5 TSI). Live gauges (demo or BLE ELM327), full ECU map, Autophix 7610 companion.

## Open on the tablet

1. Import this repo in Vercel (Hobby is fine).
2. Deploy. Open the `*.vercel.app` URL in **Chrome** on the tablet.
3. Chrome menu → **Install app**.
4. Open **TAOS CLUSTER** → **Dash mode** (landscape, keep awake).

No database or env vars. Auth stays off.

## Live data

The Autophix 7610 is a wired handheld. It does not stream to this app.

For live RPM / boost / temps: unplug the 7610, plug a **BLE** ELM327 (OBDLink CX or Veepeak BLE+) into the purple 16-pin port in the driver footwell, ignition on, then **Connect tablet → Bluetooth ELM327**.

iPad can show the gauges. It cannot pair a BLE OBD dongle.
