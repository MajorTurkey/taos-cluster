# TAOS CLUSTER

Tablet dash for a Volkswagen Taos (2022+, 1.5 TSI). Built for landscape use.

Neon gauges. Drive types: Street, Sport, Eco, Tow, Off-road. **Live OBD only — no demo.**

## Live data

The Autophix 7610 is a wired handheld. It does not stream to this app.

Unplug the 7610, plug a **BLE** ELM327 / OBDLink CX into the purple 16-pin port, pair from **Chrome** (Web Bluetooth). Silk on Kindle Fire cannot pair BLE.

Needles sit at zero until an adapter is live.

## Drive types

Switch on the Drive screen or in Setup. Each type changes neon color, which tiles sit on the strip, and how early the shift lights go hot.

- Street — cyan daily
- Sport — magenta, earlier redline
- Eco — green, MPG first
- Tow — amber, temps + battery
- Off-road — lime, throttle + load

## Open

1. Vercel deploys from `main`.
2. Chrome → pair adapter → Drive.
3. Gear → keep awake + fullscreen.

No database or env vars. Auth stays off.
