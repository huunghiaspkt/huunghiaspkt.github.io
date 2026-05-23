---
sidebar_position: 6
description: Read the BME280 — and any Zephyr sensor — through the uniform sensor_sample_fetch / sensor_channel_get API.
---

# Sensors

The previous four pages described, validated, and compiled the BME280 driver into your firmware — through the [overlay](./devicetree), the [binding](./binding-yaml), and [Kconfig](./kconfig). This page reads from it.

Zephyr's sensor API provides a uniform interface for every sensor, regardless of interface (I2C, SPI) or manufacturer. If a driver exists in the Zephyr tree, reading a sensor is always the same three steps:

1. Get the device
2. Call `sensor_sample_fetch()`
3. Call `sensor_channel_get()` for each measurement

<br/>

---

## The sensor API — reading the BME280

```c
#include <zephyr/drivers/sensor.h>

/* Step 1: get the device (resolved at compile time from DTS) */
static const struct device *bme280 = DEVICE_DT_GET(DT_NODELABEL(bme280));

int main(void)
{
    struct sensor_value temp, press, hum;

    if (!device_is_ready(bme280)) {
        LOG_ERR("BME280 not ready");
        return -ENODEV;
    }

    while (1) {
        /* Step 2: trigger a measurement */
        sensor_sample_fetch(bme280);

        /* Step 3: read the measured values */
        sensor_channel_get(bme280, SENSOR_CHAN_AMBIENT_TEMP, &temp);
        sensor_channel_get(bme280, SENSOR_CHAN_PRESS,        &press);
        sensor_channel_get(bme280, SENSOR_CHAN_HUMIDITY,     &hum);

        LOG_INF("T: %d.%06d C  P: %d.%06d kPa  RH: %d.%06d %%",
                temp.val1, temp.val2,
                press.val1, press.val2,
                hum.val1, hum.val2);

        k_sleep(K_SECONDS(10));
    }
}
```

That's the whole app. The overlay says "BME280 is on `i2c0` at `0x76`," the Kconfig pulled in the driver, the binding validated the node — and now `sensor_sample_fetch` knows how to talk to it.

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

The BME280 supports temperature, pressure, and humidity. Other sensors fill in different channels from the same standard list:

| Channel constant | Meaning |
|---|---|
| `SENSOR_CHAN_AMBIENT_TEMP` | Temperature (°C) |
| `SENSOR_CHAN_HUMIDITY` | Relative humidity (%RH) |
| `SENSOR_CHAN_PRESS` | Atmospheric pressure (kPa) |
| `SENSOR_CHAN_ACCEL_XYZ` | 3-axis acceleration (m/s²) |
| `SENSOR_CHAN_GYRO_XYZ` | 3-axis angular velocity (rad/s) |
| `SENSOR_CHAN_LIGHT` | Ambient light (lux) |

Not every sensor supports every channel. If a channel isn't supported, `sensor_channel_get()` returns `-ENOTSUP`.

The power of this design: swap the BME280 for an SHT31 or an LIS2DH in the overlay, change `CONFIG_BME280=y` to `CONFIG_SHT3XD=y`, and the rest of the application code is unchanged.

<br/>

---

## Next: keep the BME280 powered only when you need it

Reading the sensor once every 10 seconds and leaving it powered the other 9.99 seconds wastes ~50× more energy than necessary. The next page — [Power Management](./power-management) — wraps these fetches with `pm_device_action_run()` so the BME280 sleeps between measurements.
