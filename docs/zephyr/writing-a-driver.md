---
title: Writing a Zephyr Driver
sidebar_label: Writing a Driver
---

# Writing a Zephyr Sensor Driver

_Using a minimal thermistor ADC driver as the example._

Sometimes the sensor you're using doesn't have an in-tree Zephyr driver. This is a walkthrough
of writing one from scratch — specifically a driver for an NTC thermistor read via the ADC,
conforming to Zephyr's `SENSOR_CHAN_AMBIENT_TEMP` API.

After reading this, you'll be able to write a driver for any simple sensor and have it behave
exactly like the in-tree drivers (`sht3xd`, `bme680`, etc.).

---

## Driver anatomy

A minimal Zephyr sensor driver has four files:

```
drivers/sensor/ntc_thermistor/
├── ntc_thermistor.c          # Driver implementation
├── ntc_thermistor.h          # Private header (optional)
├── CMakeLists.txt            # Build integration
└── Kconfig                   # Config symbol
```

And a DTS binding:

```
dts/bindings/sensor/
└── my,ntc-thermistor.yaml
```

---

## The DTS binding

The binding file defines what properties your DTS node can have and validates them at build time.

```yaml title="dts/bindings/sensor/my,ntc-thermistor.yaml"
description: NTC thermistor via ADC channel

compatible: "my,ntc-thermistor"

include: [base.yaml, adc-device.yaml]

properties:
  io-channels:
    required: true
    description: ADC channel the thermistor divider output connects to

  pullup-uohm:
    type: int
    default: 10000000   # 10 kΩ in micro-ohms
    description: Pull-up resistor value in micro-ohms

  ntc-b-param:
    type: int
    default: 3950
    description: Steinhart-Hart B parameter for the NTC
```

The `include: [adc-device.yaml]` provides the `io-channels` binding schema automatically.

---

## Kconfig

```kconfig title="drivers/sensor/ntc_thermistor/Kconfig"
config NTC_THERMISTOR
    bool "NTC thermistor ADC driver"
    default y
    depends on ADC
    help
      Driver for NTC thermistors connected via a resistor divider to an ADC.
      Exposes SENSOR_CHAN_AMBIENT_TEMP.
```

---

## The driver

```c title="drivers/sensor/ntc_thermistor/ntc_thermistor.c"
#include <zephyr/device.h>
#include <zephyr/drivers/sensor.h>
#include <zephyr/drivers/adc.h>
#include <zephyr/logging/log.h>
#include <math.h>

LOG_MODULE_REGISTER(ntc_thermistor, CONFIG_SENSOR_LOG_LEVEL);

/* Per-instance driver data (one struct per DTS node) */
struct ntc_data {
    struct adc_sequence seq;
    int16_t raw;
};

/* Per-instance config (generated from DTS at build time) */
struct ntc_config {
    const struct adc_dt_spec adc;
    uint32_t pullup_uohm;   /* pull-up resistor in micro-ohms */
    int      b_param;       /* NTC B parameter */
};

static int ntc_sample_fetch(const struct device *dev, enum sensor_channel chan)
{
    const struct ntc_config *cfg = dev->config;
    struct ntc_data *data = dev->data;

    return adc_read(cfg->adc.dev, &data->seq);
}

static int ntc_channel_get(const struct device *dev,
                            enum sensor_channel chan,
                            struct sensor_value *val)
{
    const struct ntc_config *cfg = dev->config;
    const struct ntc_data   *data = dev->data;

    if (chan != SENSOR_CHAN_AMBIENT_TEMP) {
        return -ENOTSUP;
    }

    /* Convert raw ADC count → voltage → resistance → temperature */
    int32_t mv = data->raw;
    adc_raw_to_millivolts_dt(&cfg->adc, &mv);

    /* Voltage divider: R_ntc = R_pullup * Vout / (Vref - Vout) */
    uint32_t vref_mv = adc_ref_internal(cfg->adc.dev);
    double   r_ntc   = (double)cfg->pullup_uohm / 1000.0
                     * mv / (vref_mv - mv);

    /* Steinhart-Hart (B-parameter form):
     *   1/T = 1/T0 + (1/B) * ln(R/R0)
     * T0 = 298.15 K (25 °C), R0 = 10 kΩ nominal */
    double T0 = 298.15;
    double R0 = 10000.0;
    double inv_T = 1.0 / T0 + (1.0 / cfg->b_param) * log(r_ntc / R0);
    double temp_c = (1.0 / inv_T) - 273.15;

    val->val1 = (int32_t)temp_c;
    val->val2 = (int32_t)((temp_c - val->val1) * 1e6);

    return 0;
}

static const struct sensor_driver_api ntc_api = {
    .sample_fetch = ntc_sample_fetch,
    .channel_get  = ntc_channel_get,
};

static int ntc_init(const struct device *dev)
{
    const struct ntc_config *cfg = dev->config;
    struct ntc_data *data = dev->data;

    if (!adc_is_ready_dt(&cfg->adc)) {
        LOG_ERR("ADC not ready");
        return -ENODEV;
    }

    adc_channel_setup_dt(&cfg->adc);

    /* Set up the ADC sequence once; reuse on every fetch */
    data->seq = (struct adc_sequence){
        .buffer      = &data->raw,
        .buffer_size = sizeof(data->raw),
    };
    adc_sequence_init_dt(&cfg->adc, &data->seq);

    return 0;
}

/* DT_INST_FOREACH_STATUS_OKAY expands once per enabled DTS node
 * with compatible = "my,ntc-thermistor". */
#define NTC_DEFINE(inst)                                                    \
    static struct ntc_data ntc_data_##inst;                                 \
    static const struct ntc_config ntc_cfg_##inst = {                       \
        .adc        = ADC_DT_SPEC_INST_GET(inst),                           \
        .pullup_uohm = DT_INST_PROP(inst, pullup_uohm),                     \
        .b_param    = DT_INST_PROP(inst, ntc_b_param),                      \
    };                                                                       \
    SENSOR_DEVICE_DT_INST_DEFINE(inst, ntc_init, NULL,                      \
                                  &ntc_data_##inst, &ntc_cfg_##inst,        \
                                  POST_KERNEL, CONFIG_SENSOR_INIT_PRIORITY, \
                                  &ntc_api);

DT_INST_FOREACH_STATUS_OKAY(NTC_DEFINE)
```

---

## Key patterns to understand

**`DT_INST_FOREACH_STATUS_OKAY`**: this macro expands your `#define NTC_DEFINE(inst)` once
per enabled DTS node with `compatible = "my,ntc-thermistor"`. If you add a second thermistor
node to your overlay, you get two driver instances with zero extra code.

**`SENSOR_DEVICE_DT_INST_DEFINE`**: registers the device in Zephyr's device table with
`POST_KERNEL` init level. The device will be findable via `DEVICE_DT_GET(DT_NODELABEL(...))`.

**`adc_sequence_init_dt`**: takes an `adc_dt_spec` (from the DTS binding) and fills in the
resolution, channel ID, and reference from the DTS — no manual ADC channel config needed.

---

## CMakeLists.txt

```cmake title="drivers/sensor/ntc_thermistor/CMakeLists.txt"
zephyr_library_named(ntc_thermistor)
zephyr_library_sources(ntc_thermistor.c)
zephyr_library_include_directories(.)
```

Add to the parent `CMakeLists.txt`:
```cmake
add_subdirectory_ifdef(CONFIG_NTC_THERMISTOR ntc_thermistor)
```
