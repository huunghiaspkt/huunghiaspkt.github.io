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
| [How to Find the API You Need](./finding-apis) | Quick lookup: GPIO, I2C, SPI, UART, ADC, PWM, threads, timers, semaphores |
| [Meet the ESP32-S3-DevKitC](./esp32s3-board) | The board used for all examples — specs and board target |
| [Writing Overlays](./overlays) | Add sensors and peripherals to your application |
| [WS2812 RGB LED](./ws2812) | Drive the built-in RGB LED using the Zephyr LED strip API |
| [Threads](./threads) | Run Hello World and WS2812 concurrently — your first multi-threaded firmware |

## Core mental model

```
prj.conf          →  what is compiled
.overlay          →  what hardware exists
application code  →  what the firmware does
```

These three files are the skeleton of every Zephyr project. Master them here, apply them forever.

:::info
Devicetree is the part most engineers find confusing. The [Common Mistakes](./common-mistakes) page was written from real debugging sessions — read it before you need it.
:::
