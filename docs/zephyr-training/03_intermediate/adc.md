---
sidebar_position: 15
description: Read analog voltages with Zephyr's ADC API — battery monitoring, sensor inputs, io-channels.
---

# ADC

ADCs turn voltages into numbers. Use them for battery voltage, light sensors, potentiometers, current-shunt amplifiers — anything where the output is "a voltage between 0 and N volts."

:::info
References: [Zephyr ADC overview](https://docs.zephyrproject.org/latest/hardware/peripherals/adc.html) and the [ADC API doxygen](https://docs.zephyrproject.org/apidoc/latest/group__adc__interface.html).
:::

<br/>

---

## Enable ADC

```kconfig
CONFIG_ADC=y
```

ESP32-S3 has two SADCs (`adc1`, `adc2`) — but **`adc2` is unavailable when WiFi is active**, so default to `adc1` for any pin you also need during a BLE/WiFi session. nRF52840 has a single 12-bit SAADC with 8 channels.

<br/>

---

## Devicetree — declare a channel

```dts
&adc1 {
    status = "okay";
    #address-cells = <1>;
    #size-cells = <0>;

    channel@4 {
        reg = <4>;
        zephyr,gain = "ADC_GAIN_1";
        zephyr,reference = "ADC_REF_INTERNAL";
        zephyr,acquisition-time = <ADC_ACQ_TIME_DEFAULT>;
        zephyr,resolution = <12>;
    };
};

/ {
    zephyr,user {
        io-channels = <&adc1 4>;
    };
};
```

The `io-channels` property is the standard Zephyr way for an application (or a sensor driver) to reference one or more ADC channels.

<br/>

---

## C code — single read

```c
#include <zephyr/drivers/adc.h>

static const struct adc_dt_spec adc_chan =
    ADC_DT_SPEC_GET(DT_PATH(zephyr_user));

int main(void)
{
    int16_t sample;
    struct adc_sequence seq = {
        .buffer      = &sample,
        .buffer_size = sizeof(sample),
    };

    adc_channel_setup_dt(&adc_chan);
    adc_sequence_init_dt(&adc_chan, &seq);

    while (1) {
        adc_read_dt(&adc_chan, &seq);

        int32_t mv = sample;
        adc_raw_to_millivolts_dt(&adc_chan, &mv);

        printk("Raw: %d  mV: %d\n", sample, mv);
        k_msleep(1000);
    }
}
```

`adc_raw_to_millivolts_dt()` accounts for gain and reference, so you get a real voltage instead of a raw count.

<br/>

---

## Battery voltage example

To read a LiPo battery through a 2:1 divider on `GPIO4`:

```c
int32_t bat_mv = sample;
adc_raw_to_millivolts_dt(&adc_chan, &bat_mv);
bat_mv *= 2;   /* undo the divider */
LOG_INF("Battery: %d mV", bat_mv);
```

A 3.7V LiPo reads around 4200 mV fully charged, 3300 mV nearly empty. Below 3000 mV the cell is damaged — cut off and sleep.

<br/>

---

## Oversampling for cleaner readings

ADC samples are noisy. Average several:

```c
seq.oversampling = 4;   /* take 2^4 = 16 samples, return mean */
```

This is a hardware feature on nRF SAADC. On ESP32-S3 it's software in the driver — same API, slightly slower.

<br/>

---

## Common gotchas

| Symptom | Cause |
|---|---|
| Reading is 0 or maxed (4095) | Channel disabled, wrong pin, or input out of reference range |
| Reading drifts with WiFi/BLE active | ESP32 `adc2` blocked by radio — switch to `adc1` |
| Always the same value | Forgot `adc_channel_setup_dt()` before first `adc_read_dt()` |
| Off by 2x or 3x | Voltage divider on the input — multiply in software |

:::warning
On ESP32-S3, the SAR ADC is **not** linear at the rails. Calibration accuracy drops below ~150 mV and above ~2450 mV (default attenuation). Design your divider so the expected range falls in the linear region.
:::
