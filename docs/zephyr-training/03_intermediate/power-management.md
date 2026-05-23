---
sidebar_position: 7
description: Suspend and resume the BME280 between readings using Zephyr's runtime power management API.
---

# Sensor Power Management

The application from the previous page reads the BME280 every 10 seconds. In between, the sensor draws roughly **3.4 µA** in normal mode and **0.1 µA** in sleep. On a 225 mAh CR2032 coin cell, this difference is the gap between weeks and years of runtime.

Zephyr's runtime power management (PM) lets you suspend a device between uses with a single function call — if the driver implements it.

<br/>

---

## Enabling runtime PM

Add to `prj.conf`:

```kconfig
CONFIG_PM=y
CONFIG_PM_DEVICE=y
```

`CONFIG_PM_DEVICE=y` enables the per-device suspend/resume interface.

<br/>

---

## Suspending and resuming the BME280

Wrap each `sensor_sample_fetch` from the previous page with PM calls:

```c
#include <zephyr/pm/device.h>

static const struct device *bme280 = DEVICE_DT_GET(DT_NODELABEL(bme280));

int main(void)
{
    while (1) {
        /* Wake the sensor */
        pm_device_action_run(bme280, PM_DEVICE_ACTION_RESUME);

        /* BME280 needs ~2 ms to leave sleep mode */
        k_sleep(K_MSEC(2));

        sensor_sample_fetch(bme280);

        struct sensor_value temp, press, hum;
        sensor_channel_get(bme280, SENSOR_CHAN_AMBIENT_TEMP, &temp);
        sensor_channel_get(bme280, SENSOR_CHAN_PRESS,        &press);
        sensor_channel_get(bme280, SENSOR_CHAN_HUMIDITY,     &hum);

        LOG_INF("T: %d.%06d C  P: %d.%06d kPa",
                temp.val1, temp.val2, press.val1, press.val2);

        /* Suspend the sensor again */
        pm_device_action_run(bme280, PM_DEVICE_ACTION_SUSPEND);

        /* Sleep for 10 seconds */
        k_sleep(K_SECONDS(10));
    }
}
```

That's the whole change. The driver decides what RESUME and SUSPEND actually mean for the BME280 — typically writing the `ctrl_meas` register to switch between *normal* and *sleep* mode.

<br/>

---

## Does the driver support PM?

Not all Zephyr drivers implement PM. Check:

```bash
grep -n "pm_device_action\|PM_DEVICE_DT_INST_DEFINE" \
  zephyr/drivers/sensor/bosch/bme280/bme280.c
```

If `PM_DEVICE_DT_INST_DEFINE` appears, the driver supports runtime PM.

:::warning
If you call `pm_device_action_run()` on a driver that doesn't implement PM, it returns `-ENOTSUP` silently. Always check the return value during development:

```c
int ret = pm_device_action_run(bme280, PM_DEVICE_ACTION_SUSPEND);
if (ret && ret != -ENOTSUP) {
    LOG_ERR("PM suspend failed: %d", ret);
}
```
:::

<br/>

---

## What PM actually does to the BME280

When you call `PM_DEVICE_ACTION_SUSPEND` on the BME280:
1. The Zephyr driver writes `mode = 00` to the `ctrl_meas` register (sleep mode)
2. The chip drops to ~0.1 µA

When you call `PM_DEVICE_ACTION_RESUME`:
1. The driver writes `mode = 11` (normal mode) to `ctrl_meas`
2. The chip restarts continuous measurement after the configured oversampling delay

This is the *consumer* side of PM — you call into the driver. The next page (Writing Drivers) shows the other side: how the driver implements `PM_DEVICE_ACTION_SUSPEND` and `_RESUME` for itself.

<br/>

---

## Runtime PM — let Zephyr ref-count for you

The example above does manual suspend/resume. For multi-threaded code, Zephyr's **runtime PM** is safer — Zephyr reference-counts the requests so the chip stays awake as long as *any* caller needs it:

```kconfig
CONFIG_PM_DEVICE_RUNTIME=y
```

```c
pm_device_runtime_get(bme280);   /* +1 ref, wakes if needed */
sensor_sample_fetch(bme280);
pm_device_runtime_put(bme280);   /* -1 ref, suspends at 0 */
```

If two threads call `_get` and only one calls `_put`, the chip stays on. Both must `_put` to suspend.

<br/>

---

## BLE + I2C conflict during PM

On ESP32, the radio and I2C share the clock tree. With `CONFIG_PM=y`, there are occasional I2C NACK errors when a sensor fetch happens during a BLE connection event.

**Fix:** delay the sensor fetch by 5–10 ms after a BLE connection interval boundary:

```c
/* Wait until we're not in a BLE connection event */
k_sleep(K_MSEC(5));
sensor_sample_fetch(bme280);
```

This was observed on a real ESP32 + BME280 build.

:::info
This is a known issue with ESP32 when `CONFIG_BT=y` and `CONFIG_PM=y` are both active. It's not a bug — it's a hardware constraint. The 5 ms workaround is reliable in practice.
:::

<br/>

---

## Next: write a driver that implements these PM hooks

You now know how to *use* a PM-capable driver. The next page — [Writing Drivers](./writing-drivers) — shows the other side. You've described the BME280 in devicetree, validated it with a binding, enabled it through Kconfig, read from it via the sensor API, and suspended it with PM. The final step is to write the driver beneath all of that yourself.
