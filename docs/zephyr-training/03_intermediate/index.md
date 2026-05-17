---
sidebar_position: 1
description: Build real firmware features — I2C sensors, SPI, threads, BLE, and power management.
---

# Zephyr Intermediate

You know how to build and flash firmware. Now learn the configuration and hardware description systems that underpin every real Zephyr application, then move into multi-peripheral firmware, RTOS threading, BLE, and power management.

## Prerequisites

- Completed [Zephyr Basic](/docs/zephyr-training/basic/) — working west build, GPIO, and overlay basics

## What's in this section

| Page | What you'll learn |
|---|---|
| [How Zephyr Fits Together](./zephyr-layers) | How overlay, binding, Kconfig, and driver connect — the full picture |
| [Devicetree](./devicetree) | Layer 1 — the three-layer DTS model, node references, how hardware gets described |
| [DTS Binding YAML](./binding-yaml) | Layer 2 — define what properties your DTS node accepts |
| [Kconfig](./kconfig) | Layer 3 — enable/disable drivers and features, read `.config` |
| [Writing Drivers](./writing-drivers) | Layer 4 — build a driver and connect it to its compatible string |
| [I2C Sensors](./i2c-sensors) | Fetch temperature, humidity, accelerometer data using the sensor API |
| [Power Management](./power-management) | Suspend peripherals between readings, cut idle current |
| [Thread Synchronization](./threads) | Semaphores, mutexes, message queues, and work queues |
| [BLE Basics](./ble-basics) | Advertise, connect, and expose data as a GATT characteristic |
| [Common Mistakes](./common-mistakes) | The errors that waste the most time — with exact fixes |

## The shift at this level

Basic is about understanding Zephyr's building blocks. Intermediate is about **composing** them: a thread that wakes on a timer, fetches an I2C sensor, updates a BLE characteristic, then suspends the sensor and sleeps. Real firmware does all of that at once.

:::info
The I2C + BLE interaction on ESP32 has a known conflict — the radio and I2C share the clock tree. The [Power Management](./power-management) page documents the workaround from a real build.
:::
