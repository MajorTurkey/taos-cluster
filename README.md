# TAOS CLUSTER

Tablet dash for a Volkswagen Taos (2022+, 1.5 TSI). Built for a **Kindle Fire 12th gen** (Silk) in landscape.

Live gauges run in **demo** on the Fire. Silk has no Web Bluetooth, so a BLE ELM327 will not pair on this tablet. Use demo on the Fire; use Chrome + BLE on a phone if you want live OBD.

## Open on the Fire

1. Vercel deploys from `main`.
2. On the Fire, open Silk and go to the `*.vercel.app` URL.
3. Silk menu → **Add to Home Screen**.
4. Landscape. Gear → keep awake + fullscreen.

No database or env vars. Auth stays off.

## Live data (not on Silk)

The Autophix 7610 is a wired handheld. It does not stream to this app.

For live RPM / boost / temps: unplug the 7610, plug a **BLE** ELM327 into the purple 16-pin port, then pair from **Chrome** (not Silk).
