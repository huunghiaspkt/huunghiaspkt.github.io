---
sidebar_position: 1
description: Build real firmware features — I2C sensors, SPI, threads, BLE, and power management.
---

# Zephyr Intermediate

You know how to build and flash firmware. Now learn the configuration and hardware description systems that underpin every real Zephyr application, then move into multi-peripheral firmware (I2C, SPI, ADC, PWM), RTOS threading, BLE, power management, and shipping firmware updates (Sysbuild + MCUboot/FOTA).

:::info
This section is organized to mirror the [Nordic Developer Academy nRF Connect SDK Intermediate](https://academy.nordicsemi.com/courses/nrf-connect-sdk-intermediate/) curriculum, adapted for ESP32-S3 with notes on nRF differences where they matter.
:::

## Prerequisites

- Completed [Zephyr Basic](/docs/zephyr-training/basic/) — working west build, GPIO, and overlay basics

## What's in this section

| Page | What you'll learn |
|---|---|
| [How Zephyr Fits Together](./zephyr-layers) | How overlay, binding, Kconfig, and driver connect — the full picture |
| [Devicetree](./devicetree) | Layer 1 — the three-layer DTS model, node references, how hardware gets described |
| [DTS Binding YAML](./binding-yaml) | Layer 2 — define what properties your DTS node accepts |
| [Kconfig](./kconfig) | Layer 3 — enable/disable drivers and features, read `.config` |
| [Sensors](./i2c-sensors) | Use the sensor API — `sensor_sample_fetch`, `sensor_channel_get`, `struct sensor_value` |
| [Power Management](./power-management) | Suspend the sensor between readings to cut idle current |
| [Writing Drivers](./writing-drivers) | Build the driver under all of the above — out-of-tree module, PM, custom APIs |
| [Thread Synchronization](./threads) | Semaphores, mutexes, message queues, and work queues |
| [BLE Basics](./ble-basics) | Advertise, connect, and expose data as a GATT characteristic |
| [WiFi](./wifi) | Connect ESP32-S3 to a 2.4 GHz network — `wifi_mgmt`, DHCP, security types |
| [Common Mistakes](./common-mistakes) | The errors that waste the most time — with exact fixes |
| [PWM](./pwm) | LEDs, servos, motors — `pwm_set_pulse_dt` and the consumer/controller model |
| [SPI](./spi) | Read SPI sensors and displays — `spi_transceive`, CS handling, mode flags |
| [ADC](./adc) | Battery voltage, analog inputs — `adc_read_dt` and `adc_raw_to_millivolts_dt` |
| [Sysbuild](./sysbuild) | Build app + MCUboot + network core in one `west build` |
| [Bootloaders & DFU/FOTA](./dfu-fota) | MCUboot, image slots, FOTA over BLE/WiFi/UART |

## The shift at this level

Basic is about understanding Zephyr's building blocks. Intermediate is about **composing** them: a thread that wakes on a timer, fetches an I2C sensor, updates a BLE characteristic, then suspends the sensor and sleeps. Real firmware does all of that at once.

:::info
The I2C + BLE interaction on ESP32 has a known conflict — the radio and I2C share the clock tree. The [Power Management](./power-management) page documents the workaround from a real build.
:::
