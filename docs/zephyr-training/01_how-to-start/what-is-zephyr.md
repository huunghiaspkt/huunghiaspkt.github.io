---
sidebar_position: 1
description: What Zephyr is, why it exists, and why you should care.
---

# What is Zephyr?

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img src="/img/zephyr-logo-light.svg" alt="Zephyr Project logo" style={{width: '320px'}} />
</div>

Zephyr is a free, open-source RTOS built for embedded devices — from tiny sensors with 32 KB of flash all the way to connected products with displays, cameras, and wireless stacks.

It's backed by the **Linux Foundation** and used in real products by companies like Intel, Nordic Semiconductor, NXP, and Espressif.

> Think of it as Linux for microcontrollers — but actually designed to fit there.

<br/>

---

## Why does it exist?

Every chip vendor used to ship their own SDK. Nordic had one. NXP had another. STM had theirs. None of them talked to each other. Porting firmware between chips meant rewriting everything.

**Zephyr is the answer to that mess.**

One RTOS. One driver model. One build system. Write your sensor driver once, run it on an ESP32, an nRF52, a STM32, or a RISC-V board — without changing the code.

<br/>

---

## What it runs on

Zephyr supports pretty much every MCU architecture that matters:

| Architecture | Examples |
|---|---|
| ARM Cortex-M (M0, M3, M4, M33, M55) | Most embedded devices |
| Xtensa LX6 / LX7 | ESP32 family |
| RISC-V | ESP32-C3, C6, H2 — and growing fast |
| ARM Cortex-A | Bigger chips, Linux-class processors |
| x86 | Yes, it runs on x86 too |

Over **1,000 boards** supported out of the box. If your chip exists, there's a good chance Zephyr already knows about it.

<br/>

---

## What it gives you

Instead of writing your own I2C driver from scratch, Zephyr gives you a complete, production-ready stack:

| Feature | What it means |
|---|---|
| **Devicetree** | Describe your hardware in a text file — the OS maps it to drivers |
| **Kconfig** | Enable only what you need; nothing extra gets compiled in |
| **Driver model** | Same API for every sensor, every bus, on every chip |
| **BLE 5.0** | Full Bluetooth stack built in |
| **Networking** | TCP/IP, LwM2M, MQTT, CoAP — take your pick |
| **RTOS primitives** | Threads, semaphores, message queues |
| **MCUboot** | Secure bootloader and OTA updates |

All of it open source. **Apache 2.0 license.** No royalties, no vendor lock-in.

<br/>

---

## Who uses it

:::info[Already used Zephyr without knowing it?]
If you've ever used the **nRF Connect SDK**, you were already running Zephyr. Nordic built their entire SDK on top of it. Golioth's device SDK also targets Zephyr, and dozens of industrial IoT platforms ship firmware built on it.
:::

<br/>

---

## The one catch

Devicetree, Kconfig, and `west` are all unfamiliar when you come from Arduino or bare metal. The learning curve is real — but once it clicks, you won't go back.

I've been through it. This training is what I wish I had when I started.

<br/>

:::info[Official reference]
[docs.zephyrproject.org — Introduction to Zephyr](https://docs.zephyrproject.org/latest/introduction/index.html)
:::
