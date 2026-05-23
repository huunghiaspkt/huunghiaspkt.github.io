---
sidebar_position: 4
description: Write a DTS binding YAML file to define what properties your devicetree node accepts.
---

# DTS Binding YAML

The binding YAML file defines what properties a DTS node with your `compatible` string can have. Zephyr validates every node against its binding at build time.

<br/>

---

## The BME280 binding — the running example

The previous page showed the BME280 overlay. This is the binding it's validated against — the real file from the Zephyr tree:

```yaml title="dts/bindings/sensor/bosch,bme280-i2c.yaml"
description: BME280 integrated environmental sensor

compatible: "bosch,bme280"

include: [sensor-device.yaml, i2c-device.yaml]
```

Six lines, no custom properties. Everything you need to validate the BME280 overlay comes from the two `include:` files:
- `i2c-device.yaml` provides `reg` (the I2C address) and the unit-address rules.
- `sensor-device.yaml` marks this node as a Zephyr sensor so the sensor API works on it.

There's also `bosch,bme280-spi.yaml` — same `compatible`, includes `spi-device.yaml` instead. Zephyr picks the right binding by looking at the parent bus (see `bus` and `on-bus` below).

This minimal style is the norm for hardware that fits an existing Zephyr abstraction. Bindings get longer only when the device has properties Zephyr doesn't already know how to handle — current-thresholds, gain settings, calibration coefficients.

<br/>

---

## A richer binding — the BMP581 barometer

BME280 covers the simplest case. Most drivers also need config knobs — sample rates, oversampling, interrupt polarity — and that's where the `properties:` section earns its keep. The same Bosch family has a much richer sibling: the **BMP581 barometer**. Its binding exposes about a dozen knobs and is one of the longer sensor bindings in the Zephyr tree.

The full file lives at `dts/bindings/sensor/bosch,bmp581.yaml` in your Zephyr checkout. Below is the same file with the long enum lists collapsed for readability — the structure is exact:

```yaml title="dts/bindings/sensor/bosch,bmp581.yaml (real, enum lists abbreviated)"
description: |
    The BMP581 is a Barometric pressure sensor.

    When setting the sensor DTS properties, make sure to include
    bmp581.h and use the macros defined there.

compatible: "bosch,bmp581"

include: [sensor-device.yaml, i2c-device.yaml]

properties:
  int-gpios:
    type: phandle-array
    description: Interrupt pin.

  odr:
    type: int
    default: 0x1C                          # BMP581_DT_ODR_1_HZ
    description: Output data rate.
    enum:
      - 0x00                               # BMP581_DT_ODR_240_HZ
      - 0x01                               # BMP581_DT_ODR_218_5_HZ
      # … 32 values total …

  press-osr:
    type: int
    default: 0x00                          # BMP581_DT_OVERSAMPLING_1X
    description: Pressure oversampling rate.
    enum:
      - 0x00                               # BMP581_DT_OVERSAMPLING_1X
      # … 8 values total …

  temp-osr:
    type: int
    default: 0x00
    enum: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]

  power-mode:
    type: int
    default: 1                             # BMP581_DT_MODE_NORMAL
    enum:
      - 1                                  # BMP581_DT_MODE_NORMAL
      - 2                                  # BMP581_DT_MODE_FORCED
      - 3                                  # BMP581_DT_MODE_CONTINUOUS

  press-iir:
    type: int
    default: 0x00
    enum: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]

  temp-iir:
    type: int
    default: 0x00
    enum: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]

  fifo-watermark:
    type: int
    description: FIFO watermark level in frame count. Valid range: 1 – 15.
```

<br/>

The matching overlay node:

```dts title="myapp.overlay"
&i2c0 {
    status = "okay";

    bmp581: bmp581@46 {
        compatible = "bosch,bmp581";
        reg = <0x46>;

        int-gpios  = <&gpio0 6 GPIO_ACTIVE_HIGH>;
        odr        = <BMP581_DT_ODR_25_HZ>;
        press-osr  = <BMP581_DT_OVERSAMPLING_8X>;
        power-mode = <BMP581_DT_MODE_NORMAL>;
    };
};
```

The driver opens its source file with `#define DT_DRV_COMPAT bosch_bmp581`. Between BME280's six-line binding and BMP581's full grammar, you've now seen every top-level construct a binding YAML can use. The rest of this page is a reference to that grammar.

:::info
Unlike BME280 (which splits into `-i2c.yaml` and `-spi.yaml`), BMP581 lives in a single binding file. This older single-file style is still common in the Zephyr tree.
:::

<br/>

---

## Top-level binding keys

Between BME280 and BMP581 you've seen the four keys that show up in almost every binding:

| Key | BME280 | BMP581 | Purpose |
|---|---|---|---|
| `description` | ✅ | ✅ | Free-form text about the hardware. Shows up in the generated docs. |
| `compatible` | ✅ | ✅ | The `"vendor,device"` string this binding matches. **Required.** |
| `include` | ✅ | ✅ | Pull in other bindings (composition — see below). |
| `properties` | — | ✅ | Map of property name → schema. Empty in BME280; the bulk of BMP581. |

A few more keys exist for specialized cases (`child-binding`, `bus`, `on-bus`, `title`) — they're covered further down the page where they earn their keep.

The next sections walk through each of the four keys above, starting with `include` — the load-bearing one for both bindings.

<br/>

---

## `include` — inherit from base bindings

BME280's binding is six lines because `i2c-device.yaml` does most of the work. `include:` is how a binding inherits property schemas from a standard set of base files:

| Include | Adds |
|---|---|
| `base.yaml` | `status`, `compatible`, `label`, `reg` framework |
| `i2c-device.yaml` | `reg` as an I2C address, plus `on-bus: i2c` |
| `spi-device.yaml` | `spi-max-frequency`, `reg` as a CS index, plus `on-bus: spi` |
| `adc-device.yaml` | `io-channels` schema |
| `sensor-device.yaml` | Marks the node as a Zephyr sensor for the build system |
| `gpio.yaml` | `gpio-controller`, `#gpio-cells` |

`include:` can also take a list of objects to override specific fields — useful when you want to inherit but tighten a constraint:

```yaml
include:
  - name: base.yaml
    property-allowlist: [status, label]   /* drop the rest */
```

<br/>

---

## Property definition keys

When a binding *does* declare custom properties (BME280 doesn't, but most sensors with config knobs do), each entry inside the `properties:` map can use these keys:

| Key | What it does |
|---|---|
| `type` | The data type (table below). **Required.** |
| `required` | `true` to make absence a build error. |
| `default` | Value used when the DTS node omits the property. |
| `description` | Human text — surfaces in build errors and docs. |
| `enum` | List of permitted values. Build fails if DTS picks anything else. |
| `const` | Property must equal this exact value (rarely used). |
| `deprecated` | Emits a build warning if the DTS uses it. |
| `specifier-space` | Custom name for `phandle-array` cells (e.g. `pwm` → `#pwm-cells`). |
| `min` / `max` | Range constraints for `int` and array lengths. |

Look at the BMP581 binding above and you'll see most of these in use: `type:` on every property, `default:` on `odr`, `enum:` listing the ODR/OSR/IIR options, `description:` on the human-readable fields.

<br/>

---

## Property types — declare, assign, and read

Each property type has three sides: how you **declare** it in the binding YAML, how the user **assigns** it in DTS, and how your driver **reads** it in C. The YAML and DTS blocks below are excerpts from the BMP581 binding and overlay above. The C macros assume `DT_DRV_COMPAT bosch_bmp581`; the non-instance form `DT_PROP(DT_NODELABEL(bmp581), …)` works identically.

<br/>

### `int` — single number

YAML (under `properties:` in `bosch,bmp581-common.yaml`):
```yaml
odr:
  type: int
  default: 0x1C                          # BMP581_DT_ODR_1_HZ
  enum: [0x00, 0x01, …, 0x1F]
```
DTS (inside the `bmp581` node):
```dts
odr = <BMP581_DT_ODR_25_HZ>;
```
C:
```c
uint8_t rate = DT_INST_PROP(0, odr);
```

`default:` means the C value falls back to the default when DTS omits the property. `enum:` makes the build fail if DTS picks a value not in the list.

<br/>

### `phandle-array` — references with attached "cells"

The workhorse type. Used for `gpios`, `pwms`, `io-channels`, `dmas` — anything that needs both a controller and per-use parameters. The `int-gpios` line in the BMP581 overlay is the canonical shape:

YAML:
```yaml
int-gpios:
  type: phandle-array
  description: Interrupt pin.
```

<br/>

DTS:
```dts
int-gpios = <&gpio0 6 GPIO_ACTIVE_HIGH>;   /* controller, pin, flags */
```
C:
```c
/* Manual access — controller + cell-by-cell */
const struct device *ctlr =
    DEVICE_DT_GET(DT_INST_PHANDLE_BY_IDX(0, int_gpios, 0));
gpio_pin_t pin = DT_INST_GPIO_PIN(0, int_gpios);

/* Or — bundle into a struct in one shot (preferred) */
static const struct gpio_dt_spec irq = GPIO_DT_SPEC_INST_GET(0, int_gpios);
gpio_pin_configure_dt(&irq, GPIO_INPUT);
```

The high-level `*_DT_SPEC_GET` macros (`GPIO_DT_SPEC_GET`, `SPI_DT_SPEC_GET`, `ADC_DT_SPEC_GET`, `PWM_DT_SPEC_GET`) bundle the controller pointer and all cells into one struct — almost always what you want.

<br/>

### Types BMP581 doesn't exercise

BMP581 only uses two types (`int` and `phandle-array`) — typical for a sensor that's mostly configured by numeric knobs and one interrupt line. The remaining types are common elsewhere in Zephyr; they follow the same declare-assign-read pattern.

**`boolean`** — presence-only flag (no `= true` in DTS). Common for interrupt polarity or feature toggles on bigger drivers:
```yaml
properties:
  hw-flow-control: { type: boolean }
```

<br/>

```dts
hw-flow-control;                       /* present = true; omit = false */
```

<br/>

```c
bool flow = DT_INST_PROP(0, hw_flow_control);
```

**`string`** — text. Often combined with `enum:` for a finite set of modes. UART `parity` (from `uart-controller.yaml`) is the canonical real example — every serial driver reads it this way:
```yaml
properties:
  parity:
    type: string
    enum: ["none", "odd", "even", "mark", "space"]
```

<br/>

```dts
parity = "even";
```

<br/>

```c
const char *s = DT_INST_PROP(0, parity);
int idx = DT_INST_ENUM_IDX(0, parity);              /* 2 for "even" */
switch (DT_INST_STRING_TOKEN(0, parity)) { … }
```

**`array`** — list of cell-sized numbers. `reg` is technically a one-element array on I2C children, but the type shines for things like color channel orders:
```yaml
properties:
  color-mapping:
    type: array
    required: true
```

<br/>

```dts
color-mapping = <0 1 2>;
```

<br/>

```c
size_t count = DT_INST_PROP_LEN(0, color_mapping);
uint32_t first = DT_INST_PROP_BY_IDX(0, color_mapping, 0);
```

**`string-array`** — list of strings. Standard for `dma-names`:
```yaml
properties:
  dma-names: { type: string-array }
```

<br/>

```dts
dma-names = "tx", "rx";
```

<br/>

```c
const char *first = DT_INST_PROP_BY_IDX(0, dma_names, 0);   /* "tx" */
```

**`uint8-array`** — raw bytes in square brackets. Used for MAC addresses, raw EEPROM blobs:
```yaml
properties:
  mac-address: { type: uint8-array }
```

<br/>

```dts
mac-address = [de ad be ef 00 01];
```

<br/>

```c
static const uint8_t mac[] = DT_INST_PROP(0, mac_address);
```

**`phandle`** / **`phandles`** — references with no cells:
```yaml
properties:
  parent-bus: { type: phandle }
  shared:     { type: phandles }
```

<br/>

```dts
parent-bus = <&i2c0>;
shared     = <&sram0 &flash0>;
```

<br/>

```c
const struct device *p =
    DEVICE_DT_GET(DT_INST_PHANDLE(0, parent_bus));
```

**`path`** — full path or label to a node, almost only seen in `/chosen`:
```yaml
properties:
  zephyr,console: { type: path }
```

<br/>

```dts
zephyr,console = &uart0;
```

<br/>

```c
const struct device *con = DEVICE_DT_GET(DT_CHOSEN(zephyr_console));
```

**`compound`** — mixed types. No C macros are generated, so you can't read it from C. Avoid in driver bindings.

<br/>

### Helpers you'll use with any type

| Helper | What it does |
|---|---|
| `DT_INST_PROP_OR(n, prop, fallback)` | Read property, or return `fallback` if missing |
| `DT_INST_NODE_HAS_PROP(n, prop)` | `1` if the DTS node has the property, else `0` |
| `DT_INST_PROP_HAS_IDX(n, prop, idx)` | `1` if the array property has element at `idx` |
| `DT_INST_PROP_LEN(n, prop)` | Number of elements in an array-type property |

These work against any property type and are how you write defensive driver code that handles optional properties cleanly.

<br/>

---

## `child-binding` — schemas for repeated children

Some hardware abstractions are "a parent with N children of identical shape" — `pwm-leds`, `gpio-keys`, `fixed-partitions`. The parent binding describes the children using `child-binding:`:

```yaml title="dts/bindings/led/pwm-leds.yaml"
description: PWM LEDs parent node

compatible: "pwm-leds"

child-binding:
  description: PWM LED child node
  properties:
    pwms:
      type: phandle-array
      required: true
    label:
      type: string
```

<br/>

Then in DTS:

```dts
pwmleds {
    compatible = "pwm-leds";

    red:   pwm_led_0 { pwms = <&pwm0 0 PWM_MSEC(20) 0>; };
    green: pwm_led_1 { pwms = <&pwm0 1 PWM_MSEC(20) 0>; };
};
```

Each child is validated against the `child-binding:` schema — no need for a separate binding file. BME280 doesn't use this pattern (it's a single device, not a parent of identical children).

<br/>

---

## `bus` and `on-bus` — automatic bus matching

When a binding declares `bus: i2c`, every child node automatically inherits `on-bus: i2c`. **This is exactly how BME280 ends up with two bindings for one `compatible`:**

```yaml title="bosch,bme280-i2c.yaml"
compatible: "bosch,bme280"
include: [sensor-device.yaml, i2c-device.yaml]
                              /*    ↑ contributes on-bus: i2c */
```

<br/>

```yaml title="bosch,bme280-spi.yaml"
compatible: "bosch,bme280"
include: [sensor-device.yaml, spi-device.yaml]
                              /*    ↑ contributes on-bus: spi */
```

Zephyr inspects the parent bus of the BME280 node in your overlay. If the parent is `&i2c0`, it picks the I2C binding; if `&spi2`, it picks the SPI one. Same `compatible`, different schema and (usually) different driver source file.

<br/>

---

## Using the binding in DTS

The BME280 overlay from the previous page validates cleanly against `bosch,bme280-i2c.yaml`:

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
&i2c0 {
    status = "okay";

    bme280: bme280@76 {
        compatible = "bosch,bme280";   /* picks bosch,bme280-i2c.yaml */
        reg = <0x76>;                  /* required by i2c-device.yaml */
    };
};
```

The build catches anything the binding rejects — wrong-type `reg`, missing required properties, unknown extra properties — with the file and line number.

<br/>

---

## Accessing properties in the driver

The BME280 driver reads its DTS via standard macros. With `DT_DRV_COMPAT bosch_bme280` at the top:

```c
struct bme280_config {
    union {
        const struct i2c_dt_spec i2c;   /* via i2c-device.yaml include */
        const struct spi_dt_spec spi;
    } bus;
};

/* I2C-variant config — one struct per matching DTS node */
static const struct bme280_config bme280_cfg_0 = {
    .bus.i2c = I2C_DT_SPEC_INST_GET(0),
};
```

The `I2C_DT_SPEC_INST_GET(0)` macro bundles the I2C controller pointer and the slave address (`0x76`) into one struct — that's all the driver needs to talk to the device.

:::tip
DTS uses hyphens in property names (`clock-frequency`). The C macros use underscores (`clock_frequency`). Zephyr converts automatically in `DT_INST_PROP`.
:::

<br/>

---

## Validating your binding

```bash
# Build your project — DTS validation runs at build time
west build -b esp32s3_devkitc/esp32s3/procpu .

# Check for binding validation errors in the build output
# They look like: "dt-validation: property 'reg' is missing"
```

:::info
Reference: [Devicetree bindings syntax](https://docs.zephyrproject.org/latest/build/dts/bindings-syntax.html) and [DTS intro & syntax](https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html) in the Zephyr docs.
:::
