---
sidebar_position: 4
description: Write a DTS binding YAML file to define what properties your devicetree node accepts.
---

# DTS Binding YAML

The binding YAML file defines what properties a DTS node with your `compatible` string can have. Zephyr validates every node against its binding at build time.

<br/>

---

## Minimal binding

```yaml title="dts/bindings/sensor/vendor,my-sensor.yaml"
description: My custom NTC thermistor sensor via ADC

compatible: "vendor,my-sensor"

include: [base.yaml, adc-device.yaml]

properties:
  io-channels:
    required: true
    description: ADC channel the sensor output connects to

  pullup-uohm:
    type: int
    default: 10000000
    description: Pull-up resistor in micro-ohms

  ntc-b-param:
    type: int
    default: 3950
    description: Steinhart-Hart B parameter for the NTC
```

<br/>

---

## `include` — inherit from base bindings

`include: [base.yaml]` provides standard properties (`status`, `compatible`, `label`). You always need this.

`include: [adc-device.yaml]` adds the `io-channels` schema automatically. Specific includes are available for:
- `i2c-device.yaml` — I2C devices (provides `reg` validation)
- `spi-device.yaml` — SPI devices
- `adc-device.yaml` — ADC channels
- `gpio.yaml` — GPIO pins

<br/>

---

## Property types

| Type | Example | DT value |
|---|---|---|
| `bool` | `enabled: true` | `enabled;` |
| `int` | `pullup-uohm: int` | `pullup-uohm = <10000000>;` |
| `string` | `label: string` | `label = "SENSOR";` |
| `phandle-array` | `io-channels: phandle-array` | `io-channels = <&adc0 2>;` |
| `array` | `gpios: array` | `gpios = <&gpio0 13 0>;` |

<br/>

---

## `required: true`

Mark a property as required if the driver cannot function without it. Zephyr will emit a build error if the DTS node omits a required property.

<br/>

---

## Using the binding in DTS

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
/ {
    my_thermistor: thermistor {
        compatible = "vendor,my-sensor";
        io-channels = <&adc0 2>;
        pullup-uohm = <10000000>;   /* 10 kΩ */
        ntc-b-param = <3950>;
    };
};
```

<br/>

---

## Accessing properties in the driver

After defining the binding, access property values in C using `DT_INST_PROP`:

```c
struct my_config {
    const struct adc_dt_spec adc;   /* from adc-device.yaml include */
    uint32_t pullup_uohm;
    int b_param;
};

static const struct my_config my_cfg_0 = {
    .adc        = ADC_DT_SPEC_INST_GET(0),
    .pullup_uohm = DT_INST_PROP(0, pullup_uohm),
    .b_param    = DT_INST_PROP(0, ntc_b_param),
};
```

:::tip
DTS uses hyphens in property names (`ntc-b-param`). The C macros use underscores (`ntc_b_param`). Zephyr converts automatically in `DT_INST_PROP`.
:::

<br/>

---

## Validating your binding

```bash
# Build your project — DTS validation runs at build time
west build -b esp32s3_devkitc/esp32s3/procpu .

# Check for binding validation errors in the build output
# They look like: "dt-validation: property 'pullup-uohm' is missing"
```
