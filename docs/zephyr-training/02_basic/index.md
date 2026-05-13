---
sidebar_position: 1
description: Learn Zephyr's core building blocks — Kconfig, devicetree, GPIO, and UART logging.
---

# Zephyr Basic

You can build and flash a Hello World. Now learn the three systems that underpin every real Zephyr application: **Kconfig** (what gets compiled), **devicetree** (what hardware exists), and the **driver model** (how you talk to it).

## Prerequisites

- Completed [How to Start](/docs/zephyr-training/how-to-start) — working west build
- ESP32 DK or equivalent supported board

## What's in this section

| Page | What you'll learn |
|---|---|
| [Kconfig](kconfig) | Enable/disable drivers and features, read `.config`, avoid dependency traps |
| [Devicetree](devicetree) | The three-layer model, node references, how hardware gets described |
| [Writing Overlays](overlays) | Add sensors and peripherals to your application |
| [GPIO](gpio) | Read buttons, blink LEDs, handle interrupts |
| [Common Mistakes](common-mistakes) | The 6 errors that waste the most time — with exact fixes |

## Core mental model

```
prj.conf          →  what is compiled
.overlay          →  what hardware exists
application code  →  what the firmware does
```

These three files are the skeleton of every Zephyr project. Master them here, apply them forever.

:::info
Devicetree is the part most engineers find confusing. The [Common Mistakes](common-mistakes) page was written from real debugging sessions — read it before you need it.
:::
