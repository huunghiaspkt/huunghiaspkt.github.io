---
sidebar_position: 1
description: Production-grade Zephyr patterns — custom boards, OTA updates, watchdogs, NVS storage, and shipping firmware.
---

# Zephyr Real Product

Intermediate taught you how to write features. Real Product teaches you how to **ship them**. The gap between "it works on the dev kit" and "it works in production on 1000 units" is bigger than most engineers expect.

## Prerequisites

- Comfortable with [Zephyr Intermediate](/docs/zephyr-training/intermediate)
- Have a project with multiple peripherals running

## What's in this section

| Page | What you'll learn |
|---|---|
| [Custom Board](./custom-board) | Create a board definition for your own PCB — no dev kit as crutch |
| [Watchdog](./watchdog) | Hardware and software watchdogs — never ship without them |
| OTA with MCUboot *(coming soon)* | Over-the-air firmware updates: dual-bank flash, signing, recovery |
| NVS Storage *(coming soon)* | Persist configuration across reboots safely |
| Production Kconfig *(coming soon)* | Strip debug overhead, harden for field deployment |

## The real product mindset

On a dev kit:
- You have a J-Link to recover from bad firmware
- You can reset manually if it hangs
- Logging goes to RTT and you can read it

In production:
- A bad OTA update bricks the device if there's no recovery
- A firmware hang means a customer call
- Logs go nowhere unless you built logging into the firmware

This section closes that gap.

:::info
**Coming soon** — pages are being written from real production builds. Check back or watch the [Build Diary](/blog) for progress updates.
:::
