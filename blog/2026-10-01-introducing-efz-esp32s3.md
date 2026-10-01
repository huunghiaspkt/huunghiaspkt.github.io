---
slug: introducing-efz-esp32s3
title: "Introducing the EFZ-ESP32S3"
authors: [huunghia]
tags: [hardware, zephyr, announcement]
date: 2026-10-01
image: /img/efz/efz-front-back.jpg
---

**A board is coming.** We built the one this course always needed — an ESP32-S3 with every peripheral a Zephyr lesson touches already on it, flashed and debugged over a single USB-C cable. Meet the **EFZ-ESP32S3**.

{/* truncate */}

![EFZ-ESP32S3 — front and back](/img/efz/efz-front-back.jpg)

## Why we built our own board

You can learn a lot on a dev kit. But a dev kit is a bare chip on a breakout — the moment a lesson needs a sensor, a microphone, an SD card, or a screen, you're on a breadboard with jumper wires, and half the time you spend debugging is debugging the wiring, not the firmware.

We wanted the opposite: a board where **the hardware is never the variable.** Where "read the sensor" means *read the sensor*, not "wire up the sensor, hope the pull-ups are right, then read it." So we designed one.

## What's on it

The EFZ-ESP32S3 is a bare **ESP32-S3** (dual-core Xtensa LX7, Wi-Fi + Bluetooth LE) with 8 MB of external flash — and the parts every lesson in the course actually uses, soldered on and already described in the devicetree:

- 🌡️ **SHT30** temperature + humidity sensor (I²C)
- 🎛️ **MPU-6500** 6-axis IMU with an interrupt line (I²C)
- 🌈 A **WS2812 RGB** LED, plus two plain LEDs and three buttons
- 📈 An **NTC thermistor** on the ADC
- 🎙️ An **INMP441** microphone and a **MAX98357A** speaker amp (I²S audio)
- 💾 A **microSD** slot (4-bit SDIO, FAT)
- 🖥️ A **TFT display** connector on the back
- 🔌 Broken-out **I²C / UART / SPI** headers for your own wiring

Everything is powered, flashed, and debugged over **one USB-C cable** — the ESP32-S3's native USB Serial/JTAG is the console, so there's no separate programmer to buy.

## The part we're proudest of

It's not a feature on the silkscreen. It's that **every example in the course runs on this board, and we verified every one of them on it** — the real console output, the real errors, the real fixes on the lesson pages are from this hardware, not from a simulator or a hand-wave. The board has upstream-style **Zephyr board support** (hardware model v2), so `west build -b efz_esp32s3/esp32s3/procpu` just works, from your first Blinky to a signed, field-updatable image.

That's the whole point of EmbeddedFun: *real code, real hardware, real results.* The EFZ-ESP32S3 is what makes the "real hardware" part true.

## Who it's for

- **Engineers learning Zephyr** who want to follow the course on the exact board it was written for — no wiring, no guesswork.
- **Teachers and workshops** who need a kit where every student's hardware is identical.
- **Tinkerers** who want a capable ESP32-S3 board with sensors, audio, storage, and a screen, ready to hack on.

## Board resources

Everything you need to build on it, or build your own board from it:

- 📐 **Schematic (PDF)** — [download the full EFZ-ESP32S3 schematic](/schematics/EFZ-ESP32S3-V1-schematic.pdf) (9 sheets). Also linked from the [Hardware](/docs/hardware) section.
- 🧩 **Zephyr board support** — the devicetree, pinctrl and Kconfig for the board: [`boards/embeddedfun/efz_esp32s3`](https://github.com/huunghiaspkt/zephyr/tree/main/boards/embeddedfun/efz_esp32s3) (hardware model v2, `-b efz_esp32s3/esp32s3/procpu`).
- 📋 **Full spec, pin map & errata** — [Meet the EFZ-ESP32S3](/docs/zephyr-training/basic/efz-esp32s3-board): every peripheral, its pins, the strapping pins and the gotchas.
- 💻 **Code & samples** — the course's verified samples live in [`samples/efz_samples`](https://github.com/huunghiaspkt/zephyr/tree/main/samples/efz_samples); every one runs on this board.
- 🐙 **GitHub** — [huunghiaspkt](https://github.com/huunghiaspkt).

## It's coming — stay tuned

The design is done and it has been through every lesson on this site. We're getting it ready for the community now.

Want one when it lands? **Watch the [GitHub repo](https://github.com/huunghiaspkt)** and keep an eye on the [Build Diary](/blog) — details on how to get your hands on an EFZ-ESP32S3 are coming here first.

In the meantime, everything the board does, you can read end to end in [Zephyr Training](/docs/zephyr-training/how-to-start/what-is-zephyr) — and it all runs, verified, on the board you see above.
