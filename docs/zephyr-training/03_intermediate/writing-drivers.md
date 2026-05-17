---
sidebar_position: 6
description: When to write a custom Zephyr driver and what the driver skeleton looks like.
---

# Writing Drivers

Zephyr has 200+ in-tree sensor drivers. Before writing your own, check:

```bash
# Search in bindings
ls zephyr/dts/bindings/sensor/ | grep -i sensirion
```

If your sensor isn't there, you have two options:

1. **Add a binding + driver to Zephyr upstream** — correct long-term, time-consuming
2. **Write an out-of-tree driver** — faster, lives in your application repo

This module covers option 2: an out-of-tree driver that integrates cleanly with Zephyr's driver model.

<br/>

---

## When you need a custom driver?

Write a driver when:
- The sensor has no in-tree support
- You need behavior the in-tree driver doesn't expose (e.g., raw register access)
- You're abstracting a custom peripheral (ADC channel, UART-based sensor)

Don't write a driver when:
- An in-tree driver exists — use it even if it exposes more than you need
- You just need to add I2C address support — submit a one-line patch upstream

<br/>

---

## Driver anatomy

A minimal Zephyr sensor driver has four pieces:

```
drivers/sensor/my_sensor/
├── my_sensor.c           # Driver implementation
├── CMakeLists.txt        # Build integration
└── Kconfig               # Config symbol

dts/bindings/sensor/
└── vendor,my-sensor.yaml # DTS binding
```

The next page covers the **DTS binding YAML** — this is where you define what properties your DTS node accepts.

The page after that covers the **driver implementation** — the C file that implements the Zephyr sensor API using `DT_INST_FOREACH_STATUS_OKAY`.

<br/>

---

## The driver model contract

Every Zephyr sensor driver must:

1. Define a `struct sensor_driver_api` with at minimum `sample_fetch` and `channel_get`
2. Register itself with `SENSOR_DEVICE_DT_INST_DEFINE` (or `DEVICE_DT_INST_DEFINE`)
3. Implement `pm_device_pm_action` if it wants runtime PM support

The Zephyr kernel never calls your driver directly — it calls through the `sensor_driver_api` vtable. This is what makes the sensor API uniform across all drivers.
