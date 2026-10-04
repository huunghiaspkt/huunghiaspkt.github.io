---
sidebar_position: 4
sidebar_label: Meet the EFZ-ESP32S3
description: The EmbeddedFun training board in this course — its build target and where to find its full spec.
---

# Meet the EFZ-ESP32S3

![EFZ-ESP32S3 — front and back](/img/efz/efz-front-back.jpg)

The EFZ-ESP32S3 is the EmbeddedFun training board: an ESP32-S3 with every peripheral the course uses already on board — an SHT30 temperature and humidity sensor, a 6-axis IMU, an RGB LED, two LEDs and buttons, a microphone, a speaker amplifier, a microSD slot and a display. It is powered, flashed and debugged over a single USB-C cable.

## Build target

```bash
west build -b efz_esp32s3/esp32s3/procpu .
```

Every hands-on page has an **EFZ-ESP32S3** tab with the commands for this target.

## Full spec, pin map and schematic

The board's pin map, strapping pins, errata and schematic are on its page in **[Boards → EFZ-ESP32S3](/docs/boards/efz-esp32s3)**.
