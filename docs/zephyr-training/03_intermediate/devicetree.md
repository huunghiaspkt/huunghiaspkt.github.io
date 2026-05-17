---
sidebar_position: 3
description: What devicetree is, why Zephyr uses it, and the three-layer model you need to understand.
---

# Devicetree

Devicetree (DTS) is the hardware description language Zephyr uses to tell the kernel what peripherals exist, where they are, and how they connect to the CPU. Instead of hardcoding GPIO pin numbers and I2C addresses in your application code, you describe them in a `.dts` or `.overlay` file.

<br/>

---

## Why devicetree?

Without devicetree, moving firmware from one board to another means hunting for every `#define PIN_SDA 26` and updating it. With devicetree, you write the hardware description once in a board file, and your application code uses the same `DT_NODELABEL(i2c0)` reference on every board.

Zephyr has 1000+ board definitions. Each one ships with a `.dts` file. Your application adds an `.overlay` on top.

<br/>

---

## The three-layer model

Three DTS files are merged at build time:

```
SoC DTS                  Board DTS                 Your overlay
esp32s3.dtsi       +    esp32s3_devkitc.dts + myapp.overlay
(chip peripherals)       (board pin assignments)   (app-specific config)
      |                         |                         |
      +-------------------------+-------------------------+
                                |
                     build/zephyr/zephyr.dts
                     (the final merged tree)
```

**SoC DTS** — defines every peripheral in the chip (`i2c0`, `spi1`, `uart0`). You never edit this.

**Board DTS** — selects which peripherals the board uses and maps them to physical pins. Lives in the Zephyr repo under `boards/espressif/esp32s3_devkitc/`. You don't edit this for application-level work.

**Your overlay** — enables nodes, sets addresses, adds child devices (sensors, displays). **This is what you write.**

:::info
After every build, inspect `build/zephyr/zephyr.dts` to see the final merged result. If your sensor node is missing, the problem is in your overlay.
:::

<br/>

---

## The WS2812 overlay — what we already wrote

You have already seen this overlay in Basic. Now read it through the lens of the three-layer model:

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
...
i2s_led: &i2s0 {
    status = "okay";

    dmas = <&dma 3>;
    dma-names = "tx";

    led_strip: ws2812@0 {
        compatible = "worldsemi,ws2812-i2s";

        reg = <0>;
        chain-length = <1>;
        color-mapping = <LED_COLOR_ID_GREEN
                         LED_COLOR_ID_RED
                         LED_COLOR_ID_BLUE>;
        reset-delay = <500>;
    };
};
...
```

This overlay operates entirely on **Layer 3 — your overlay**. It does not touch `esp32s3.dtsi` or `esp32s3_devkitc.dts`. It only opens existing nodes (`&i2s0`, `&dma`, `&i2s0_default`) and adds what the application needs on top of them.

That is the pattern for every overlay you will ever write.

The pages in this section cover each part of this in depth.
