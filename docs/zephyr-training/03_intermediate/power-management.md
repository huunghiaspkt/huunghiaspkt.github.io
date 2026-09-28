---
sidebar_position: 8
description: Suspend and resume a sensor between readings with Zephyr's device power management API — and what to do when the driver doesn't support it.
---

# Sensor Power Management

The application from the previous page reads the SHT30 every 10 seconds. What the sensor draws in between depends on its mode. In **periodic** mode it keeps measuring on its own and idles at roughly **45 µA**; in **single-shot** mode it only measures when asked and idles at roughly **0.2 µA** (SHT3x datasheet, typical values). On a 225 mAh CR2032 coin cell, that difference is the gap between months and years of runtime.

Zephyr's device power management (PM) lets you suspend a device between uses with a single function call — if the driver implements it. This page shows the call, and then what happens when the driver *doesn't*.

<br/>

---

## Enabling device PM

Add to `prj.conf`:

```kconfig
CONFIG_PM_DEVICE=y
```

`CONFIG_PM_DEVICE=y` enables the per-device suspend/resume interface. You don't need `CONFIG_PM` for this — that one is *system* power management (putting the whole SoC to sleep), a separate feature.

<br/>

---

## Suspending and resuming a sensor

Wrap each `sensor_sample_fetch` from the previous page with PM calls:

```c
#include <zephyr/pm/device.h>

static const struct device *sht30 = DEVICE_DT_GET(DT_NODELABEL(sht30));

int main(void)
{
    struct sensor_value temp, hum;

    while (1) {
        /* Wake the sensor */
        pm_device_action_run(sht30, PM_DEVICE_ACTION_RESUME);

        sensor_sample_fetch(sht30);
        sensor_channel_get(sht30, SENSOR_CHAN_AMBIENT_TEMP, &temp);
        sensor_channel_get(sht30, SENSOR_CHAN_HUMIDITY,     &hum);

        LOG_INF("T: %d.%06d C  RH: %d.%06d %%",
                temp.val1, temp.val2, hum.val1, hum.val2);

        /* Suspend the sensor again */
        pm_device_action_run(sht30, PM_DEVICE_ACTION_SUSPEND);

        /* Sleep for 10 seconds */
        k_sleep(K_SECONDS(10));
    }
}
```

That's the whole pattern. The driver decides what RESUME and SUSPEND actually mean for its chip — putting it into a sleep mode, stopping a periodic measurement, or switching off its supply.

There's a catch, though. Before you rely on this, check the driver.

<br/>

---

## Does the driver support PM?

Not all Zephyr drivers implement PM. Check:

```bash
grep -n "pm_device_action\|PM_DEVICE_DT_INST_DEFINE" \
  zephyr/drivers/sensor/sensirion/sht3xd/sht3xd.c
```

If `PM_DEVICE_DT_INST_DEFINE` appears, the driver supports device PM. For the in-tree SHT30 driver, **this grep finds nothing** — `sht3xd.c` has no PM hooks at all.

So what does the loop above actually do on the SHT30? Nothing. Each `pm_device_action_run()` call returns `-ENOSYS` ("this device does not implement power management") and the sensor stays exactly as it was.

:::warning
A missing PM implementation doesn't crash anything — the call just fails quietly. Always check the return value during development:

```c
int ret = pm_device_action_run(sht30, PM_DEVICE_ACTION_SUSPEND);
if (ret == -ENOSYS) {
    LOG_WRN("driver has no PM support");
} else if (ret < 0 && ret != -EALREADY) {
    LOG_ERR("PM suspend failed: %d", ret);
}
```

`-EALREADY` just means the device was already in the state you asked for.
:::

<br/>

---

## Saving power without PM

The in-tree driver can't be suspended — but it can be told not to waste power in the first place. By default it runs the SHT30 in **periodic** mode (`CONFIG_SHT3XD_PERIODIC_MODE`, 1 measurement per second), so the chip never really rests. Switch to single-shot in `prj.conf`:

```kconfig
CONFIG_SHT3XD_SINGLE_SHOT_MODE=y
```

Now the driver sends one measurement command per `sensor_sample_fetch()`, and between fetches the SHT30 sits idle on its own — no PM calls needed. For a sensor read every 10 seconds, that's the single biggest saving available.

<br/>

---

## What PM would do for the SHT30

If the driver *did* implement PM, what should suspend mean for this chip?

- **Single-shot mode:** the chip already idles after every measurement. Suspend has little to add — except guaranteeing that state.
- **Periodic mode:** the chip keeps measuring until it receives the *Break* command (`0x3093`). A PM-aware driver sends Break on SUSPEND, so the sensor is idle no matter what mode it was left in.
- **Board-level power:** if the sensor's supply goes through a load switch, SUSPEND is where the driver turns it off entirely.

This is the *consumer* side of PM — you call into the driver. The [Writing Drivers](./writing-drivers#exercise-2--add-power-management) page shows the other side: you add exactly this `SUSPEND` / `RESUME` handling to your own SHT30 driver.

<br/>

---

## Runtime PM — let Zephyr ref-count for you

The example above does manual suspend/resume. For multi-threaded code, Zephyr's **runtime PM** is safer — Zephyr reference-counts the requests so the chip stays awake as long as *any* caller needs it:

```kconfig
CONFIG_PM_DEVICE_RUNTIME=y
```

<br/>

```c
pm_device_runtime_get(sht30);   /* +1 ref, wakes if needed */
sensor_sample_fetch(sht30);
pm_device_runtime_put(sht30);   /* -1 ref, suspends at 0 */
```

If two threads call `_get` and only one calls `_put`, the chip stays on. Both must `_put` to suspend.

Runtime PM only kicks in for devices that have it enabled — by the driver calling `pm_device_runtime_enable()`, or by the devicetree node having `zephyr,pm-device-runtime-auto;`. On a driver without PM (like the in-tree `sht3xd`), `_get` and `_put` simply return `0` and do nothing.

<br/>

---

## BLE + I2C conflict during PM

On ESP32, the radio and I2C share the clock tree. With PM enabled, there are occasional I2C NACK errors when a sensor fetch happens during a BLE connection event.

**Fix:** delay the sensor fetch by 5–10 ms after a BLE connection interval boundary:

```c
/* Wait until we're not in a BLE connection event */
k_sleep(K_MSEC(5));
sensor_sample_fetch(sht30);
```

This was observed on a real ESP32 build with an I2C sensor and BLE active.

:::info
This is a known issue with ESP32 when `CONFIG_BT=y` and power management are both active. It's not a bug — it's a hardware constraint. The 5 ms workaround is reliable in practice.
:::

<br/>

---

## Next: write a driver that implements these PM hooks

You now know how to *use* a PM-capable driver — and how to spot one that isn't. The next page — [Writing Drivers](./writing-drivers) — shows the other side. You've described the SHT30 in devicetree, validated it with a binding, enabled it through Kconfig, and read from it via the sensor API. The final step is to write the driver beneath all of that yourself — this time with the PM support the in-tree one is missing.
