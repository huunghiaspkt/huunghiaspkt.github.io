---
sidebar_position: 1
description: Build real firmware features — I2C sensors, SPI, threads, BLE, and power management.
---

# Zephyr Intermediate

You understand Kconfig, devicetree, and GPIO. Now build the things that go into real products: multi-peripheral firmware, RTOS threading, BLE connectivity, and battery-friendly power management.

## Prerequisites

- Comfortable with [Zephyr Basic](/docs/zephyr-training/basic/)
- Know how to write an overlay and enable drivers in `prj.conf`

## What's in this section

| Page | What you'll learn |
|---|---|
| [I2C Sensors](./i2c-sensors) | Fetch temperature, humidity, accelerometer data using the sensor API |
| [Power Management](./power-management) | Suspend peripherals between readings, cut idle current |
| [Threads](./threads) | Create threads, share data safely, avoid race conditions |
| [BLE Basics](./ble-basics) | Advertise, connect, and expose data as a GATT characteristic |
| [Writing Drivers](./writing-drivers) | Build a driver for a peripheral that has no in-tree support |
| [DTS Binding YAML](./binding-yaml) | Define what properties your custom driver's DTS node accepts |

## The shift at this level

Basic is about understanding Zephyr's building blocks. Intermediate is about **composing** them: a thread that wakes on a timer, fetches an I2C sensor, updates a BLE characteristic, then suspends the sensor and sleeps. Real firmware does all of that at once.

:::info
The I2C + BLE interaction on ESP32 has a known conflict — the radio and I2C share the clock tree. The [Power Management](power-management) page documents the workaround from a real build.
:::
