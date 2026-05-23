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

## The running example

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
/dts-v1/;

&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_FAST>;

    bme280: bme280@76 {
        compatible = "bosch,bme280";
        reg = <0x76>;
    };
};
```

This overlay operates entirely on **Layer 3**. It doesn't touch `esp32s3.dtsi` or `esp32s3_devkitc.dts` — it re-opens `&i2c0` and adds a child node underneath it.

<br/>

---

## Anatomy of a DTS file

Map the parts of the BME280 overlay back to the DTS grammar:

```dts
/dts-v1/;                              /* version directive — always first  */

&i2c0 {                                /* re-open existing node by label    */
    status = "okay";                   /* property = value;                 */
    clock-frequency = <I2C_BITRATE_FAST>;

    bme280: bme280@76 {                /* label : name @ unit-address       */
        compatible = "bosch,bme280";
        reg = <0x76>;
    };                                 /* children nest inside parents      */
};
```

Each BME280 token tracks to a grammar role:

- **`/dts-v1/;`** — file-level version directive. Always the first non-comment line.
- **`&i2c0 { … }`** — re-opens the SoC's existing `i2c0` node. An overlay almost always re-opens; it rarely declares root-level nodes from scratch.
- **`bme280: bme280@76 { … }`** — a child node with a label (`bme280`), a name (`bme280`), and a unit address (`76`). The unit address must equal `reg` — both are `0x76`.
- **`property = value;`** — the only statement form inside a node. Values are typed (next section).

<br/>

---

## DTS property types

Every property in the BME280 overlay is one of these three types — they're enough for any I2C sensor binding:

| BME280 property | Type | DTS syntax | Notes |
|---|---|---|---|
| `compatible = "bosch,bme280";` | **string** | quoted | Can also be a string-array (multiple compatibles) |
| `status = "okay";` | **string** | quoted | Enum: `"okay"`, `"disabled"`, `"reserved"`, `"fail"` |
| `reg = <0x76>;` | **array** (of cells) | `<…>` angle brackets | A single-cell `<0x76>` is still a one-element array |
| `clock-frequency = <I2C_BITRATE_FAST>;` | **int** | `<n>` | A single cell, treated as int by the binding |

Bindings for other hardware bring in richer types. The full list — and where you'll meet each one in Zephyr — is:

| Type | DTS syntax | Common example |
|---|---|---|
| **boolean** | `hw-flow-control;` (presence = true) | UART, USB, button bindings |
| **int** | `current-speed = <115200>;` | A single number |
| **array** | `color-mapping = <0 1 2>;` | List of numbers |
| **uint8-array** | `mac = [de ad be ef];` (square brackets, hex pairs) | MAC addresses, raw byte blobs |
| **string** | `label = "BME280";` | Text |
| **string-array** | `dma-names = "tx", "rx";` | List of strings |
| **phandle** | `parent = <&gpio0>;` | A single reference with no extra cells |
| **phandles** | `pins = <&p1 &p2>;` | Many references with no extra cells |
| **phandle-array** | `gpios = <&gpio0 13 0>;` | Reference + extra "cells" (pin + flags) |
| **path** | `route = &uart0;` | Almost exclusively in `/chosen` |

The binding YAML decides which type each property is — that's what makes `gpios = <&gpio0 13 0>` interpretable as "controller, pin, flags" instead of three raw numbers.

<br/>

---

## Three special properties — `compatible`, `reg`, `status`

These three appear on almost every node in every overlay you'll ever write. Each one in the BME280 sample:

**`compatible = "bosch,bme280";`**
The identifier that links the node to its binding (and through it, to a driver). Format is `"vendor,device"`. A node can list multiple values for backwards compatibility: `compatible = "nordic,nrf-saadc", "syscon";`. In BME280 it picks the I2C binding at `zephyr/dts/bindings/sensor/bosch,bme280-i2c.yaml` because the parent (`&i2c0`) is an I2C bus. If you wired the same chip to `&spi2`, Zephyr would pick the SPI binding for the same `compatible`.

**`reg = <0x76>;`**
What the address means depends on the parent. For memory-mapped peripherals it's `<base size>`. **For an I2C child like BME280 it's the 7-bit slave address** (BME280 is strapped to either `0x76` or `0x77` depending on the SDO pin). For SPI children it's the chip-select index. The unit address (`bme280@76`) must match `reg`.

**`status = "okay";`**
A node only generates a `struct device` if `status = "okay"`. Boards ship most peripherals as `disabled` — the BME280 overlay's first job is to flip `i2c0` to `"okay"`. If `device_is_ready()` returns false, this is the first thing to check.

<br/>

---

## Top-level directives and special nodes

The BME280 overlay only uses `/dts-v1/;` and `&label { … }`, but the full grammar offers a few more constructs you'll see in board files and other overlays:

| Construct | Purpose |
|---|---|
| `/dts-v1/;` | Version marker — always the first line |
| `/include/ "file.dts"` | Pull in another DTS file at parse time |
| `/ { … };` | The root node — top-level node declarations live here |
| `&label { … };` | **Re-open** an existing node by label — how overlays add to the tree |
| `&{/path/to/node}` | Reference a node by full path when it has no label |
| `/delete-node/ &label;` | Remove a node (e.g., to turn off a peripheral the board enabled) |
| `/delete-property/ prop;` | Remove a single property from a node |

Two special nodes live directly under `/`:

**`/chosen`** — system-wide settings the kernel reads at boot:
```dts
chosen {
    zephyr,console        = &uart0;
    zephyr,sram           = &sram0;
    zephyr,code-partition = &slot0_partition;
};
```

**`/aliases`** — short names your C code can resolve with `DT_ALIAS()`:
```dts
aliases {
    env-sensor = &bme280;              /* alias for our BME280 node */
};
```
Lets sample code work on any board that defines the alias — the sample doesn't care which controller it actually is.

<br/>

---

## Overlay operations — how `.overlay` files modify the tree

An overlay never starts from scratch. It re-opens nodes the SoC/board already defined and adds, changes, or removes properties. The BME280 overlay is the canonical pattern — three things in one shot:

```dts
&i2c0 {                                /* 1. re-open by label */
    status = "okay";                   /* 2. set/override properties */
    clock-frequency = <I2C_BITRATE_FAST>;

    bme280: bme280@76 {                /* 3. add a child node */
        compatible = "bosch,bme280";
        reg = <0x76>;
    };
};

/delete-node/ &spi3;                   /* (optional) turn off something the board enabled */
```

That's the entire overlay grammar in active use. Every overlay you write — accelerometer on I2C, display on SPI, button on GPIO — will be a variation on this same pattern.

:::info
Reference: [DTS intro & syntax](https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html) and the broader [Devicetree guide](https://docs.zephyrproject.org/latest/build/dts/index.html) in the Zephyr docs.
:::
