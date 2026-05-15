---
sidebar_position: 1
description: Set up your Zephyr development environment and run your first build in under 30 minutes.
---

# How to Start

No prior Zephyr experience needed. By the end of this section you will have a working Zephyr workspace, a compiled firmware binary, and a board running your first program.

<br/>

---

## What you'll need

- Any of the supported ESP32 boards listed below
- A Linux or macOS machine (Windows via WSL2 works)
- USB cable for flashing (esptool, no J-Link required)
- ~5 GB disk space for the Zephyr SDK

<br/>

---

## Supported chip families

Zephyr runs on **1,000+ boards** across all major chip vendors:

| Vendor | Families |
|---|---|
| **Espressif** | ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C6, ESP32-H2 |
| **Nordic Semiconductor** | nRF51, nRF52, nRF53, nRF54 |
| **STMicroelectronics** | STM32F, STM32G, STM32H, STM32L, STM32U, STM32WL |
| **NXP** | iMX8/9, LPC5, MIMXRT, MCX |
| **Texas Instruments** | CC13xx, CC26xx, MSPM0 |
| **Silicon Labs** | EFM32, EFR32 |
| **Microchip** | SAMD, SAMR, PIC32 |
| **Infineon** | PSoC, XMC |
| **GigaDevice** | GD32 (including RISC-V variants) |

For the full list, see **[docs.zephyrproject.org/latest/boards](https://docs.zephyrproject.org/latest/boards)**.

<br/>

---

## What's in this section

| Page | What you'll do |
|---|---|
| [What is Zephyr?](./what-is-zephyr) | Short intro — what it is, why it exists, who uses it |
| [Environment Setup & West](./environment) | Install west, the Zephyr SDK, and learn the daily commands |
| [Hello World](./hello-world) | Build and flash your first Zephyr application |
| [Build System](./build-system) | What happens inside `west build` and how to read errors |

<br/>

---

## Time estimate

**30–60 minutes** for a clean install. If you already have Python and a package manager, closer to 20.

<br/>

:::tip
If you get stuck on environment setup, the [Zephyr Getting Started Guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) is the authoritative reference. This section focuses on the fastest path to a working build.
:::
