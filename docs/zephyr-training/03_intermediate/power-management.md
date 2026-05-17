---
sidebar_position: 8
description: Suspend and resume sensors between readings using Zephyr's runtime power management API.
---

# Sensor Power Management

The SHT31 draws ~1.5 mA during measurement and ~2 µA in sleep. On a 225 mAh CR2032 coin cell, this difference is the gap between 14 days and years of runtime.

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

## Suspending and resuming

```c
#include <zephyr/pm/device.h>

static const struct device *sht31 = DEVICE_DT_GET(DT_NODELABEL(sht31));

int main(void)
{
    while (1) {
        /* Wake the sensor */
        pm_device_action_run(sht31, PM_DEVICE_ACTION_RESUME);

        /* Wait for sensor to wake up (SHT31 needs ~1 ms) */
        k_sleep(K_MSEC(2));

        sensor_sample_fetch(sht31);

        struct sensor_value temp, hum;
        sensor_channel_get(sht31, SENSOR_CHAN_AMBIENT_TEMP, &temp);
        sensor_channel_get(sht31, SENSOR_CHAN_HUMIDITY, &hum);

        LOG_INF("T: %d.%06d C  RH: %d.%06d %%",
                temp.val1, temp.val2, hum.val1, hum.val2);

        /* Suspend the sensor again */
        pm_device_action_run(sht31, PM_DEVICE_ACTION_SUSPEND);

        /* Sleep for 10 seconds */
        k_sleep(K_SECONDS(10));
    }
}
```

<br/>

---

## Does the driver support PM?

Not all Zephyr drivers implement PM. Check:

```bash
grep -n "pm_device_pm_action\|PM_DEVICE_DT_DEFINE" \
  zephyr/drivers/sensor/sensirion/sht3xd/sht3xd.c
```

If `PM_DEVICE_DT_DEFINE` appears, the driver supports runtime PM.

:::warning
If you call `pm_device_action_run()` on a driver that doesn't implement PM, it returns `-ENOTSUP` silently. Always check the return value during development.

```c
int ret = pm_device_action_run(sht31, PM_DEVICE_ACTION_SUSPEND);
if (ret && ret != -ENOTSUP) {
    LOG_ERR("PM suspend failed: %d", ret);
}
```
:::

<br/>

---

## What does PM actually do to the SHT31?

When you call `PM_DEVICE_ACTION_SUSPEND` on the SHT31:
1. The Zephyr driver sends the sensor's "periodic mode stop" command over I2C
2. The SHT31 enters idle state (~2 µA)

When you call `PM_DEVICE_ACTION_RESUME`:
1. The driver sends a soft reset or wakeup sequence
2. Wait at least 1 ms before issuing a measurement command

<br/>

---

## BLE + I2C conflict during PM

On ESP32, the radio and I2C share the clock tree. With `CONFIG_PM=y`, there are occasional I2C NACK errors when a sensor fetch happens during a BLE connection event.

**Fix:** delay the sensor fetch by 5–10 ms after a BLE connection interval boundary:

```c
/* Wait until we're not in a BLE connection event */
k_sleep(K_MSEC(5));
sensor_sample_fetch(sht31);
```

This was observed on a real ESP32 + SHT31 build.

:::info
This is a known issue with ESP32 when `CONFIG_BT=y` and `CONFIG_PM=y` are both active. It's not a bug — it's a hardware constraint. The 5 ms workaround is reliable in practice.
:::
