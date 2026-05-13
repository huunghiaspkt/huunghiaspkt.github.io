---
sidebar_position: 1
description: What devicetree is, why Zephyr uses it, and the three-layer model you need to understand.
---

# Devicetree

Devicetree (DTS) is the hardware description language Zephyr uses to tell the kernel what peripherals exist, where they are, and how they connect to the CPU. Instead of hardcoding GPIO pin numbers and I2C addresses in your application code, you describe them in a `.dts` or `.overlay` file.

## Why devicetree?

Without devicetree, moving firmware from one board to another means hunting for every `#define PIN_SDA 26` and updating it. With devicetree, you write the hardware description once in a board file, and your application code uses the same `DT_NODELABEL(i2c0)` reference on every board.

Zephyr has 1000+ board definitions. Each one ships with a `.dts` file. Your application adds an `.overlay` on top.

## The three-layer model

Three DTS files are merged at build time:

```
SoC DTS                  Board DTS                 Your overlay
esp32.dtsi       +    esp32_devkitc_wroom.dts + myapp.overlay
(chip peripherals)       (board pin assignments)   (app-specific config)
      |                         |                         |
      +-------------------------+-------------------------+
                                |
                     build/zephyr/zephyr.dts
                     (the final merged tree)
```

**SoC DTS** — defines every peripheral in the chip (`i2c0`, `spi1`, `uart0`). You never edit this.

**Board DTS** — selects which peripherals the board uses and maps them to physical pins. Lives in the Zephyr repo under `boards/arm/esp32_devkitc_wroom/`. You don't edit this for application-level work.

**Your overlay** — enables nodes, sets addresses, adds child devices (sensors, displays). **This is what you write.**

:::info
After every build, inspect `build/zephyr/zephyr.dts` to see the final merged result. If your sensor node is missing, the problem is in your overlay.
:::

## A minimal overlay

```dts title="boards/esp32_devkitc_wroom.overlay"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht31: sht3xd@44 {
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };
};
```

This overlay:
1. Finds the existing `i2c0` node (`&i2c0`)
2. Enables it (`status = "okay"`)
3. Adds a child node for the SHT31 sensor at I2C address 0x44

The pages in this section cover each part of this in depth.
