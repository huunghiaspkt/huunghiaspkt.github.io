---
sidebar_position: 5
description: Write a DTS binding YAML file to define what properties your devicetree node accepts.
---

# DTS Binding YAML

The binding YAML file defines what properties a DTS node with your `compatible` string can have. Zephyr validates every node against its binding at build time.

<br/>

---

## The SHT30 binding — the running example

The previous page showed the SHT30 node — in the EFZ-ESP32S3 board devicetree, or in a DevKitC overlay. This is the binding it's validated against — the real file from the Zephyr tree:

```yaml title="dts/bindings/sensor/sensirion,sht3xd.yaml"
description: Sensirion Humidity SHT3x-DIS humidity and temperature sensor

compatible: "sensirion,sht3xd"

include: [sensor-device.yaml, i2c-device.yaml]

properties:
  alert-gpios:
    type: phandle-array
    description: |
      ALERT pin.

      This pin signals active high when produced by the sensor.  The
      property value should ensure the flags properly describe the
      signal that is presented to the driver.
```

Almost everything you need to validate the SHT30 node comes from the two `include:` files:
- `i2c-device.yaml` provides `reg` (the I2C address) and the unit-address rules.
- `sensor-device.yaml` marks this node as a Zephyr sensor so the sensor API works on it.

The one property the binding adds itself, `alert-gpios`, is optional. Neither board wires the SHT30's ALERT pin, so our node doesn't set it.

The SHT30 only speaks I2C, so this is its only binding. Sensors that speak both I2C and SPI get one binding file per bus — you'll see how Zephyr chooses between them in [`bus` and `on-bus`](#bus-and-on-bus--automatic-bus-matching) below.

This minimal style is the norm for hardware that fits an existing Zephyr abstraction. Bindings get longer only when the device has properties Zephyr doesn't already know how to handle — current-thresholds, gain settings, calibration coefficients.

<br/>

---

## A richer binding — the BMP581 barometer

The SHT30 covers the simple case. Most drivers also need config knobs — sample rates, oversampling, interrupt polarity — and that's where the `properties:` section earns its keep. A good example is Bosch's **BMP581 barometer**. Its binding exposes about a dozen knobs and is one of the longer sensor bindings in the Zephyr tree.

The properties live in `dts/bindings/sensor/bosch,bmp581-common.yaml` in your Zephyr checkout. Below is that file with the long enum lists collapsed and descriptions shortened for readability — the structure is exact:

```yaml title="dts/bindings/sensor/bosch,bmp581-common.yaml (real, abbreviated)"
description: |
    The BMP581 is a Barometric pressure sensor.

    When setting the sensor DTS properties, make sure to include
    bmp581.h and use the macros defined there.

include: [sensor-device.yaml]

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
    description: FIFO watermark level in frame count.
    min: 1
    max: 15

  int-active-low:
    type: boolean
    description: Configure the INT pin as active low. Defaults to active high.

  int-open-drain:
    type: boolean
    description: Configure the INT pin as open-drain. Defaults to push-pull.
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

The driver opens its source file with `#define DT_DRV_COMPAT bosch_bmp581`. Between the SHT30's short binding and BMP581's full grammar, you've now seen every top-level construct a binding YAML can use. The rest of this page is a reference to that grammar.

:::info
Notice there's no `compatible:` in that file. The BMP581 talks I2C, SPI and I3C, so its binding is split: `-common.yaml` holds the shared properties, and three tiny per-bus files (`bosch,bmp581-i2c.yaml`, `-spi.yaml`, `-i3c.yaml`) each declare `compatible: "bosch,bmp581"` and include the common file. The SHT30, being I2C-only, keeps everything in one file.
:::

<br/>

---

## Top-level binding keys

Between the SHT30 and the BMP581 you've seen the four keys that show up in almost every binding:

| Key | SHT30 | BMP581 | Purpose |
|---|---|---|---|
| `description` | ✅ | ✅ | Free-form text about the hardware. Shows up in the generated docs. |
| `compatible` | ✅ | ✅ (per-bus files) | The `"vendor,device"` string this binding matches. **Required.** |
| `include` | ✅ | ✅ | Pull in other bindings (composition — see below). |
| `properties` | ✅ | ✅ | Map of property name → schema. One optional entry in the SHT30; the bulk of BMP581. |

A few more keys exist for specialized cases (`child-binding`, `bus`, `on-bus`, `title`) — they're covered further down the page where they earn their keep.

The next sections walk through each of the four keys above, starting with `include` — the load-bearing one for both bindings.

<br/>

---

## `include` — inherit from base bindings

The SHT30's binding is short because `i2c-device.yaml` does most of the work. `include:` is how a binding inherits property schemas from a standard set of base files:

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

When a binding declares custom properties (the SHT30 declares just one, most sensors with config knobs declare many), each entry inside the `properties:` map can use these keys:

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

Look at the BMP581 binding above and you'll see most of these in use: `type:` on every property, `default:` on `odr`, `enum:` listing the ODR/OSR/IIR options, `min:`/`max:` on `fifo-watermark`, `description:` on the human-readable fields.

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

### The other types

BMP581 uses three types — `int`, `phandle-array`, and `boolean` — typical for a sensor that's mostly configured by numeric knobs and one interrupt line. The remaining types are common elsewhere in Zephyr; they all follow the same declare-assign-read pattern.

**`boolean`** — presence-only flag (no `= true` in DTS). BMP581's `int-active-low` and `int-open-drain` are booleans; UARTs use one for flow control:
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

Each child is validated against the `child-binding:` schema — no need for a separate binding file. The SHT30 doesn't use this pattern (it's a single device, not a parent of identical children).

<br/>

---

## `bus` and `on-bus` — automatic bus matching

Two keys work as a pair. A **controller** binding declares which bus it provides — `i2c-controller.yaml` says `bus: i2c`, `spi-controller.yaml` says `bus: spi`. A **device** binding declares which bus it sits on — `i2c-device.yaml` contributes `on-bus: i2c`, `spi-device.yaml` contributes `on-bus: spi`. A device binding only matches a node whose parent provides that bus.

For the SHT30 that's a safety net: its binding includes `i2c-device.yaml`, so an `sht3xd` node placed under `&spi2` matches nothing and the build tells you so.

For a sensor that speaks several buses, it's how one `compatible` gets several bindings. **This is exactly how the BMP581 is split:**

```yaml title="bosch,bmp581-i2c.yaml"
compatible: "bosch,bmp581"
include: ["i2c-device.yaml", "bosch,bmp581-common.yaml"]
          #  ↑ contributes on-bus: i2c
```

<br/>

```yaml title="bosch,bmp581-spi.yaml"
compatible: "bosch,bmp581"
include: ["spi-device.yaml", "bosch,bmp581-common.yaml"]
          #  ↑ contributes on-bus: spi
```

Zephyr inspects the parent bus of the BMP581 node in your devicetree. If the parent is `&i2c0`, it picks the I2C binding; if `&spi2`, the SPI one (and `bosch,bmp581-i3c.yaml` covers I3C). Same `compatible`, same shared properties, different bus schema.

<br/>

---

## Using the binding in DTS

The SHT30 node validates cleanly against `sensirion,sht3xd.yaml`. Where it's written depends on your board:

<BoardTabs>
<BoardTab value="esp32s3_devkitc">

You add the sensor yourself, so the node goes in your app's overlay:

```dts title="boards/esp32s3_devkitc_procpu.overlay"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht30: sht3xd@44 {
        compatible = "sensirion,sht3xd";   /* matches sensirion,sht3xd.yaml */
        reg = <0x44>;                      /* required by i2c-device.yaml */
    };
};
```

</BoardTab>
<BoardTab value="efz_esp32s3">

The SHT30 is soldered on, so the node already lives in the board devicetree — no overlay needed:

```dts title="zephyr/boards/embeddedfun/efz_esp32s3/efz_esp32s3_procpu.dts (excerpt)"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_FAST>;
    pinctrl-0 = <&i2c0_default>;
    pinctrl-names = "default";

    sht30: sht3xd@44 {
        compatible = "sensirion,sht3xd";   /* matches sensirion,sht3xd.yaml */
        reg = <0x44>;                      /* required by i2c-device.yaml */
    };
};
```

</BoardTab>
</BoardTabs>

The build catches anything the binding rejects — wrong-type `reg`, missing required properties, unknown extra properties — with the file and line number.

<br/>

---

## Accessing properties in the driver

The SHT3x driver reads its DTS via standard macros. With `#define DT_DRV_COMPAT sensirion_sht3xd` at the top of `drivers/sensor/sensirion/sht3xd/sht3xd.c`:

```c
struct sht3xd_config {
    struct i2c_dt_spec bus;                  /* via i2c-device.yaml include */
#ifdef CONFIG_SHT3XD_TRIGGER
    struct gpio_dt_spec alert_gpio;          /* the optional alert-gpios */
#endif
};

/* one config struct per matching DTS node */
static const struct sht3xd_config sht3xd0_cfg_##inst = {
    .bus = I2C_DT_SPEC_INST_GET(inst),
    SHT3XD_TRIGGER_INIT(inst)                /* GPIO_DT_SPEC_INST_GET(inst, alert_gpios) */
};
```

That's an excerpt from the driver's `SHT3XD_DEFINE(inst)` macro, which runs once per enabled node. `I2C_DT_SPEC_INST_GET(inst)` bundles the I2C controller pointer and the slave address (`0x44`) into one struct — that's all the driver needs to talk to the device.

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
