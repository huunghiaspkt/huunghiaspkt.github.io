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
SoC DTS                  Board DTS                     Your overlay
esp32s3.dtsi       +     <board>.dts             +     myapp.overlay
(chip peripherals)       (board pin assignments,       (app-specific config)
                          on-board parts)
      |                         |                             |
      +-------------------------+-----------------------------+
                                |
                     build/zephyr/zephyr.dts
                     (the final merged tree)
```

**SoC DTS** — defines every peripheral in the chip (`i2c0`, `spi2`, `uart0`). You never edit this.

**Board DTS** — selects which peripherals the board uses, maps them to physical pins, and describes the parts **soldered on the PCB**. The DevKitC's lives in upstream Zephyr under `boards/espressif/esp32s3_devkitc/`; the EFZ-ESP32S3's lives in the course fork under [`boards/embeddedfun/efz_esp32s3/`](https://github.com/huunghiaspkt/zephyr/blob/main/boards/embeddedfun/efz_esp32s3/efz_esp32s3_procpu.dts). You don't edit these for application-level work.

**Your overlay** — enables nodes, sets addresses, adds child devices (sensors, displays) **you wired up yourself**. **This is what you write.**

:::info
After every build, inspect `build/zephyr/zephyr.dts` to see the final merged result. If your sensor node is missing, the problem is in your overlay (or you picked the wrong board).
:::

<br/>

---

## The running example

Our running example is an **SHT30** temperature / humidity sensor on I2C. Which layer describes it depends on your board:

<BoardTabs>
<BoardTab value="esp32s3_devkitc">

The DevKitC has no sensor on board — you wire an SHT30 module to I2C0 (SDA GPIO1, SCL GPIO2) and describe it in your overlay:

```dts title="boards/esp32s3_devkitc_procpu.overlay"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht30: sht3xd@44 {
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };
};
```

This overlay operates entirely on **Layer 3**. It doesn't touch `esp32s3.dtsi` or the DevKitC's board DTS — it re-opens `&i2c0` and adds a child node underneath it.

</BoardTab>
<BoardTab value="efz_esp32s3">

The SHT30 is soldered on the EFZ-ESP32S3, so it's already described on **Layer 2** — the [board DTS](https://github.com/huunghiaspkt/zephyr/blob/main/boards/embeddedfun/efz_esp32s3/efz_esp32s3_procpu.dts). You write **no overlay**:

```dts title="boards/embeddedfun/efz_esp32s3/efz_esp32s3_procpu.dts (excerpt)"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_FAST>;
    pinctrl-0 = <&i2c0_default>;
    pinctrl-names = "default";

    sht30: sht3xd@44 {
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };
};
```

The grammar is exactly the same as an overlay — board files and overlays are written in one language. The only difference is **who owns the file**: permanent hardware goes in the board DTS, experiments and add-ons go in your overlay.

</BoardTab>
</BoardTabs>

Either way, the merged `zephyr.dts` contains the same `sht30` node — which is why the application code is identical on both boards.

<br/>

---

## Anatomy of a DTS file

Map the parts of the SHT30 node back to the DTS grammar:

```dts
&i2c0 {                                /* re-open existing node by label    */
    status = "okay";                   /* property = value;                 */
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht30: sht3xd@44 {                 /* label : name @ unit-address       */
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };                                 /* children nest inside parents      */
};
```

Each token tracks to a grammar role:

- **`&i2c0 { … }`** — re-opens the SoC's existing `i2c0` node. An overlay almost always re-opens; it rarely declares root-level nodes from scratch.
- **`sht30: sht3xd@44 { … }`** — a child node with a label (`sht30`), a name (`sht3xd`), and a unit address (`44`). The unit address must equal `reg` — both are `0x44`. The label is what your C code uses (`DT_NODELABEL(sht30)`); the name conventionally follows the device family.
- **`property = value;`** — the only statement form inside a node. Values are typed (next section).

A full `.dts` file (like a board DTS) also starts with the version directive **`/dts-v1/;`** — always the first non-comment line. Overlays leave it out: Zephyr appends them to the board DTS, which already has it.

<br/>

---

## DTS property types

Every property on the SHT30 node is one of these types — they're enough for any I2C sensor binding:

| SHT30 property | Type | DTS syntax | Notes |
|---|---|---|---|
| `compatible = "sensirion,sht3xd";` | **string** | quoted | Can also be a string-array (multiple compatibles) |
| `status = "okay";` | **string** | quoted | Enum: `"okay"`, `"disabled"`, `"reserved"`, `"fail"` |
| `reg = <0x44>;` | **array** (of cells) | `<…>` angle brackets | A single-cell `<0x44>` is still a one-element array |
| `clock-frequency = <I2C_BITRATE_STANDARD>;` | **int** | `<n>` | A single cell, treated as int by the binding |

Bindings for other hardware bring in richer types. The full list — and where you'll meet each one in Zephyr — is:

| Type | DTS syntax | Common example |
|---|---|---|
| **boolean** | `hw-flow-control;` (presence = true) | UART, USB, button bindings |
| **int** | `current-speed = <115200>;` | A single number |
| **array** | `color-mapping = <0 1 2>;` | List of numbers |
| **uint8-array** | `mac = [de ad be ef];` (square brackets, hex pairs) | MAC addresses, raw byte blobs |
| **string** | `label = "LED1";` | Text |
| **string-array** | `dma-names = "tx", "rx";` | List of strings |
| **phandle** | `parent = <&gpio0>;` | A single reference with no extra cells |
| **phandles** | `pins = <&p1 &p2>;` | Many references with no extra cells |
| **phandle-array** | `gpios = <&gpio0 13 0>;` | Reference + extra "cells" (pin + flags) |
| **path** | `route = &uart0;` | Almost exclusively in `/chosen` |

The binding YAML decides which type each property is — that's what makes `gpios = <&gpio0 13 0>` interpretable as "controller, pin, flags" instead of three raw numbers. (The SHT30's optional `alert-gpios` is a phandle-array just like that.)

<br/>

---

## Three special properties — `compatible`, `reg`, `status`

These three appear on almost every node in every overlay you'll ever write. Each one on the SHT30 node:

**`compatible = "sensirion,sht3xd";`**
The identifier that links the node to its binding (and through it, to a driver). Format is `"vendor,device"`. A node can list multiple values for backwards compatibility: `compatible = "nordic,nrf-saadc", "syscon";`. For the SHT30 it picks `zephyr/dts/bindings/sensor/sensirion,sht3xd.yaml`. The SHT30 is I2C-only, so there's one binding; chips that also speak SPI (like the ST HTS221) ship one binding per bus under the same `compatible`, and Zephyr picks the one matching the parent bus.

**`reg = <0x44>;`**
What the address means depends on the parent. For memory-mapped peripherals it's `<base size>`. **For an I2C child like the SHT30 it's the 7-bit slave address** (the SHT30 answers on `0x44` when its ADDR pin is low, `0x45` when it's high). For SPI children it's the chip-select index. The unit address (`sht3xd@44`) must match `reg`.

**`status = "okay";`**
A node only generates a `struct device` if `status = "okay"`. Boards ship most peripherals as `disabled` — the DevKitC overlay's first job is to flip `i2c0` to `"okay"` (the EFZ board DTS already does it). If `device_is_ready()` returns false, this is the first thing to check.

<br/>

---

## Top-level directives and special nodes

The SHT30 node only uses `&label { … }`, but the full grammar offers a few more constructs you'll see in board files and other overlays:

| Construct | Purpose |
|---|---|
| `/dts-v1/;` | Version marker — always the first line of a full `.dts` |
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
    ambient-temp0 = &sht30;            /* alias for our SHT30 node */
};
```
Lets sample code work on any board that defines the alias — the sample doesn't care which sensor it actually is. (`ambient-temp0` is the alias Zephyr's own `samples/sensor/thermometer` looks for.)

<br/>

---

## Overlay operations — how `.overlay` files modify the tree

An overlay never starts from scratch. It re-opens nodes the SoC/board already defined and adds, changes, or removes properties. The DevKitC's SHT30 overlay is the canonical pattern — three things in one shot:

```dts
&i2c0 {                                /* 1. re-open by label */
    status = "okay";                   /* 2. set/override properties */
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht30: sht3xd@44 {                 /* 3. add a child node */
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };
};

/delete-node/ &spi3;                   /* (optional) turn off something the board enabled */
```

That's the entire overlay grammar in active use. Every overlay you write — accelerometer on I2C, display on SPI, button on GPIO — will be a variation on this same pattern.

:::tip[Overriding the board, not just adding to it]
Overlays can change board-level nodes too. On the EFZ-ESP32S3, `&i2c0 { clock-frequency = <I2C_BITRATE_STANDARD>; };` in your overlay would drop the board's 400 kHz bus to 100 kHz — the SHT30 node from the board DTS stays untouched.
:::

:::info
Reference: [DTS intro & syntax](https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html) and the broader [Devicetree guide](https://docs.zephyrproject.org/latest/build/dts/index.html) in the Zephyr docs.
:::
