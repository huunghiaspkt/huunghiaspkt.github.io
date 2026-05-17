---
sidebar_position: 7
description: Using Zephyr's sensor API to read I2C sensors — fetch, channel_get, and power management.
---

# Sensors

Zephyr's sensor API provides a uniform interface for every sensor, regardless of interface (I2C, SPI) or manufacturer. If a driver exists in the Zephyr tree, reading a sensor is always the same three steps:

1. Get the device
2. Call `sensor_sample_fetch()`
3. Call `sensor_channel_get()` for each measurement

<br/>

---

## The sensor API

```c
#include <zephyr/drivers/sensor.h>

/* Step 1: get the device (resolved at compile time from DTS) */
static const struct device *sht31 = DEVICE_DT_GET(DT_NODELABEL(sht31));

int main(void)
{
    struct sensor_value temp, hum;

    if (!device_is_ready(sht31)) {
        LOG_ERR("SHT31 not ready");
        return -ENODEV;
    }

    while (1) {
        /* Step 2: trigger a measurement */
        sensor_sample_fetch(sht31);

        /* Step 3: read the measured values */
        sensor_channel_get(sht31, SENSOR_CHAN_AMBIENT_TEMP, &temp);
        sensor_channel_get(sht31, SENSOR_CHAN_HUMIDITY, &hum);

        LOG_INF("T: %d.%06d C  RH: %d.%06d %%",
                temp.val1, temp.val2, hum.val1, hum.val2);

        k_sleep(K_SECONDS(10));
    }
}
```

<br/>

---

## `struct sensor_value` format

Sensor values use a fixed-point format to avoid floating point:

```c
struct sensor_value {
    int32_t val1;   /* Integer part */
    int32_t val2;   /* Fractional part (millionths) */
};
```

A reading of `24.319000 °C` is stored as `{.val1 = 24, .val2 = 319000}`.

To get a `double`:
```c
double temp_c = sensor_value_to_double(&temp);
```

:::info
`sensor_value_to_double()` is provided by Zephyr. Don't compute `val1 + val2 / 1e6` manually — the sign handling is subtle when values are negative.
:::

<br/>

---

## Supported sensor channels

| Channel constant | Meaning |
|---|---|
| `SENSOR_CHAN_AMBIENT_TEMP` | Temperature (°C) |
| `SENSOR_CHAN_HUMIDITY` | Relative humidity (%RH) |
| `SENSOR_CHAN_PRESS` | Atmospheric pressure (kPa) |
| `SENSOR_CHAN_ACCEL_XYZ` | 3-axis acceleration (m/s²) |
| `SENSOR_CHAN_GYRO_XYZ` | 3-axis angular velocity (rad/s) |
| `SENSOR_CHAN_LIGHT` | Ambient light (lux) |

Not every sensor supports every channel. If a channel isn't supported, `sensor_channel_get()` returns `-ENOTSUP`.

<br/>

---

## Next: power management

For battery-powered designs, you don't want the sensor running continuously between readings. The next page covers `pm_device_action_run()` to suspend the sensor between measurements and cut idle current.
