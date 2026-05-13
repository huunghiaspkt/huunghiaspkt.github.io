---
sidebar_position: 1
description: Set up your Zephyr development environment and run your first build in under 30 minutes.
---

# How to Start

No prior Zephyr experience needed. By the end of this section you will have a working Zephyr workspace, a compiled firmware binary, and a board running your first program.

## What you'll need

- Any of the supported ESP32 boards listed below
- A Linux or macOS machine (Windows via WSL2 works)
- USB cable for flashing (esptool, no J-Link required)
- ~5 GB disk space for the Zephyr SDK

## Supported ESP32 boards

| Board | Board ID (`-b` flag) |
|---|---|
| ESP32-DevKitC | `esp32_devkitc` |
| ESP32-S3-DevKitC | `esp32s3_devkitc` |
| ESP32-C3-DevKitM | `esp32c3_devkitm` |

For the full list of supported boards, see **[docs.zephyrproject.org/latest/boards](https://docs.zephyrproject.org/latest/boards)**.

## What's in this section

| Page | What you'll do |
|---|---|
| [What is Zephyr?](./what-is-zephyr) | Short intro — what it is, why it exists, who uses it |
| [Environment Setup](./environment) | Install west, the Zephyr SDK, and VS Code tooling |
| [Hello World](./hello-world) | Build and flash your first Zephyr application |
| [West Basics](./west) | The commands you'll use every single day |
| [Build System](./build-system) | What happens inside `west build` and how to read errors |

## Time estimate

**30–60 minutes** for a clean install. If you already have Python and a package manager, closer to 20.

:::tip
If you get stuck on environment setup, the [Zephyr Getting Started Guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) is the authoritative reference. This section focuses on the fastest path to a working build.
:::
