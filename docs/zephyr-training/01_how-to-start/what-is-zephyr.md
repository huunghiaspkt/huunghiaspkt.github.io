---
sidebar_position: 1
description: What Zephyr is, why it exists, and why you should care.
---

# What is Zephyr?

Zephyr is a free, open-source RTOS built for embedded devices — from tiny sensors with 32 KB of flash all the way to connected products with displays, cameras, and wireless stacks. It's backed by the Linux Foundation and used in real products by companies like Intel, Nordic Semiconductor, NXP, and Espressif.

Think of it as Linux for microcontrollers — but actually designed to fit there.

## Why does it exist?

Every chip vendor used to ship their own SDK. Nordic had one. NXP had another. STM had theirs. None of them talked to each other. Porting firmware between chips meant rewriting everything.

Zephyr is the answer to that mess. One RTOS. One driver model. One build system. Write your sensor driver once, run it on an ESP32, an nRF52, a STM32, or a RISC-V board — without changing the code.

## What it runs on

Zephyr supports pretty much every MCU architecture that matters:

- **ARM Cortex-M** (M0, M3, M4, M33, M55) — most embedded devices
- **Xtensa LX6/LX7** — ESP32 family
- **RISC-V** — ESP32-C3, C6, H2 and growing fast
- **ARM Cortex-A** — bigger chips, Linux-class processors
- **x86** — yes, it runs on x86 too

Over **1000 boards** supported out of the box. If your chip exists, there's a good chance Zephyr already knows about it.

## What it gives you

Instead of writing your own I2C driver from scratch, Zephyr gives you:

- **Devicetree** — describe your hardware in a text file, let the OS map it to drivers
- **Kconfig** — enable only what you need, nothing extra gets compiled in
- **Driver model** — same API for every sensor, every bus, on every chip
- **BLE 5.0** — full Bluetooth stack built in
- **Networking** — TCP/IP, LwM2M, MQTT, CoAP — take your pick
- **Threads, semaphores, message queues** — real RTOS primitives
- **MCUboot** — secure bootloader and OTA updates

All of it open source. Apache 2.0 license. No royalties, no vendor lock-in.

## Who uses it

If you've used an **nRF Connect SDK** project — you were already using Zephyr. Nordic built their entire SDK on top of it. Same with Golioth, Arduino Nano 33 BLE, and dozens of industrial IoT platforms.

## The one catch

Devicetree, Kconfig, and `west` are all unfamiliar when you come from Arduino or bare metal. I've been through it — and this is what I wish I had when I started.

:::info
Official intro: [docs.zephyrproject.org/latest/introduction](https://docs.zephyrproject.org/latest/introduction/index.html)
:::
