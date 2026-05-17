---
sidebar_position: 4
description: How to write devicetree overlays — syntax, node references, properties, and child devices.
---

# Writing Overlays

When you flash Hello World, the board's hardware is already partially described — the ESP32-S3-DevKitC ships with a `.dts` file that Espressif and the Zephyr community maintain. It defines the chip peripherals, the pins, the clocks.

But it does not know about **your application**. It does not know that you want I2S0 to drive an LED strip, or that you need I2C0 at a specific frequency with a sensor at address 0x44. An overlay is your answer to that gap — a file where you describe exactly what your application needs on top of the board's base hardware. Without it, Zephyr has no way to know which peripherals to enable or which drivers to instantiate.

**You write the overlay. Zephyr reads it at build time and wires everything up.**

<br/>

---

## Where does the overlay file live?

Your devicetree overlay file lives at:

```
devzone/hello_world/
├── boards/
│   └── esp32s3_devkitc_esp32s3_procpu.overlay
├── CMakeLists.txt
├── prj.conf
└── src/
    └── main.c
```

The filename combines the board name and qualifiers, with `/` replaced by `_`. For `esp32s3_devkitc/esp32s3/procpu`, the overlay is `boards/esp32s3_devkitc_esp32s3_procpu.overlay`.

:::tip
West finds the overlay automatically by matching the board name. You don't need to pass `-DDTC_OVERLAY_FILE=` unless you want a non-standard name.
:::

## Real board example — WS2812 RGB LED

The ESP32-S3-DevKitC has one addressable RGB LED driven by GPIO48 via I2S. This is the overlay from the official Zephyr LED strip sample:

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
/*
 * Copyright (c) 2024-2025 Espressif Systems (Shanghai) Co., Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <zephyr/dt-bindings/led/led.h>

/ {
	aliases {
		led-strip = &led_strip;
	};
};

&i2s0_default {
	group1 {
		pinmux = <I2S0_O_SD_GPIO38>;
	};
};

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

&dma {
	status = "okay";
};
```

---

```kconfig title="prj.conf"
CONFIG_LOG=y
CONFIG_LED_STRIP=y
CONFIG_LED_STRIP_LOG_LEVEL_DBG=y
```

What this overlay demonstrates:
- **`&i2s0_default`** — sets the pinmux so I2S0's output maps to GPIO48
- **`i2s_led: &i2s0`** — opens the existing I2S0 node and assigns it the label `i2s_led`
- **`ws2812@0`** — child node with `compatible = "worldsemi,ws2812-i2s"`, binding it to the WS2812 I2S driver
- **`color-mapping`** — GRB order (this LED is Green-Red-Blue, not the usual RGB)
- **`aliases`** — exposes the strip as `led-strip` so application code can find it with `DT_ALIAS(led_strip)`

:::info[Official source]
Overlay from [zephyrproject-rtos/zephyr — samples/drivers/led/led_strip/boards/esp32s3_devkitc_procpu.overlay](https://github.com/zephyrproject-rtos/zephyr/blob/main/samples/drivers/led/led_strip/boards/esp32s3_devkitc_procpu.overlay)
:::

<br/>

---

## Node references with `&`

The `&` syntax references a node defined elsewhere in the SoC or board DTS and lets you modify it. The WS2812 overlay uses this in three places:

```dts
/* Open the existing I2S0 node and configure it */
i2s_led: &i2s0 {
    status = "okay";
    dmas = <&dma 3>;
    dma-names = "tx";
    ...
};

/* Open the DMA node to enable it */
&dma {
    status = "okay";
};
```

`&i2s0` and `&dma` do not create new nodes — they open the existing ones for modification. Without `&`, you'd get a duplicate node and a build error.

The `i2s_led:` prefix on `&i2s0` assigns an additional label to the node so application code can reference it by that name.

<br/>

---

## The `compatible` property

**This is the most important property. It is a string that binds a DTS node to a specific C driver:**

```dts
led_strip: ws2812@0 {
    compatible = "worldsemi,ws2812-i2s";
    ...
};
```

Zephyr looks up `dts/bindings/led_strip/worldsemi,ws2812-i2s.yaml` to validate the node and generate the driver glue code. If the binding YAML doesn't exist, you get a build error.

The format is always `"vendor,device"`. The vendor prefix follows the DTS bindings naming convention — `worldsemi` is the manufacturer of the WS2812 chip family.

<br/>

---

## The `reg` property

`reg` identifies a device's position on its parent bus. For the WS2812 node, which lives on an I2S bus, `reg = <0>` means instance 0 on that bus:

```dts
led_strip: ws2812@0 {
    compatible = "worldsemi,ws2812-i2s";
    reg = <0>;
    ...
};
```

The `@0` in the node name is the unit address — it must always match `reg`. This is a DTS convention across all bus types.

:::note
For I2C devices, `reg` is the 7-bit address (e.g. `reg = <0x44>`). For I2S or SPI devices, it is the bus instance index. The meaning depends on the parent bus, but the `@address` convention is always the same.
:::

<br/>

---

## Status

Every peripheral node defaults to `disabled`. Set `status = "okay"` to enable it. The WS2812 overlay enables both I2S0 and DMA:

```dts
i2s_led: &i2s0 {
    status = "okay";   /* Enable I2S0 — without this the peripheral never initializes */
    ...
};

&dma {
    status = "okay";   /* Enable DMA — required for I2S TX transfers */
};
```

If you omit `status = "okay"` on either node, the build succeeds but the driver silently does nothing at runtime.

<br/>

---

## Pin routing with pinmux

For peripherals like I2S, UART, and SPI, the physical pin assignment is set in a pinmux group node. The WS2812 overlay maps I2S0's data output to GPIO48:

```dts
&i2s0_default {
    group1 {
        pinmux = <I2S0_O_SD_GPIO48>;
    };
};
```

`I2S0_O_SD_GPIO48` is a macro from the ESP32-S3 pinmux header that connects the I2S0 serial data output signal to GPIO48 — the pin the DevKitC's RGB LED is wired to.

<br/>

---

## Aliases and labels

Aliases let application code find a device by a stable name regardless of where the node lives in the tree:

```dts
/ {
    aliases {
        led-strip = &led_strip;   /* &led_strip is the node label on ws2812@0 */
    };
};
```

In C, retrieve the device using the alias:

```c
#define STRIP_NODE DT_ALIAS(led_strip)
const struct device *strip = DEVICE_DT_GET(STRIP_NODE);
```

Or by node label directly:

```c
const struct device *strip = DEVICE_DT_GET(DT_NODELABEL(led_strip));
```

:::note
DTS uses hyphens (`led-strip`), C macros use underscores (`led_strip`). Zephyr converts automatically.
:::

<br/>

---

## 😅 Don't panic — this is normal

If you are looking at this overlay and thinking *"what is all of this?"* — that reaction is completely expected.

```dts
i2s_led: &i2s0 {
    status = "okay";
    dmas = <&dma 3>;
    dma-names = "tx";
    ...
};
```

Between the `compatible` strings, the `status = "okay"` that seemingly does nothing visible, the DMA bindings, and the pinmux macros — Zephyr can feel like it demands a lot of configuration before anything lights up.

That is because it **is** doing a lot:

- 🔌 Describing the hardware that exists on the board
- 🎯 Selecting the exact driver that handles it
- 📡 Routing signals to the correct physical pins
- ⚡ Allocating DMA resources — all at **compile time**, before a single line of your application runs

This is the design. It is also what makes Zephyr portable and production-grade.

:::tip[Stick with this series]
The **Intermediate** section walks through each of these layers — devicetree, Kconfig, driver bindings — one at a time, with the reasoning behind every decision. By the end, a configuration like this will read as naturally as a `for` loop. 💪
:::
