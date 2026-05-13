---
sidebar_position: 2
description: How to write devicetree overlays — syntax, node references, properties, and child devices.
---

# Writing Overlays

Your devicetree overlay file lives at:

```
boards/<board_name>.overlay
```

The filename must match the board name exactly. For `esp32_devkitc_wroom`, the overlay is `boards/esp32_devkitc_wroom.overlay`.

:::tip
West finds the overlay automatically by matching the board name. You don't need to pass `-DDTC_OVERLAY_FILE=` unless you want a non-standard name.
:::

## Node references with `&`

The `&` syntax references a node defined elsewhere (in the SoC or board DTS) and lets you modify it:

```dts
/* Reference the existing i2c0 node and add to it */
&i2c0 {
    status = "okay";          /* Enable the peripheral */
    clock-frequency = <100000>; /* 100 kHz */

    /* Child node: sensor on this bus */
    sensor0: mysensor@48 {
        compatible = "vendor,mysensor";
        reg = <0x48>;
    };
};
```

`&i2c0` does not create a new node — it opens the existing one for modification. Without `&`, you'd get a new duplicate node.

## The `compatible` property

This is the most important property. It is a string that binds the DTS node to a specific C driver:

```dts
compatible = "sensirion,sht3xd";
```

Zephyr looks up `dts/bindings/sensor/sensirion,sht3xd.yaml` to validate the node and generate driver glue code. If the binding YAML doesn't exist, you get a build error.

The format is always `"vendor,device"`. The vendor prefix matches the DTS bindings naming convention, not necessarily the chip manufacturer's marketing name.

## The `reg` property

For I2C devices: the 7-bit address (not shifted).

```dts
/* SHT31 with ADDR pin pulled LOW → address 0x44 */
sht31: sht3xd@44 {
    compatible = "sensirion,sht3xd";
    reg = <0x44>;
};
```

The `@44` in the node name is the unit address — it must match `reg`. This is a DTS convention.

:::warning
I2C datasheets often list 8-bit addresses (0x88 for write, 0x89 for read). In DTS, always use the 7-bit form: 0x44. Zephyr shifts it internally.
:::

## Status

Every node defaults to `disabled`. Set `status = "okay"` on the parent peripheral to enable it:

```dts
&i2c0 {
    status = "okay";  /* Without this, i2c0 never initializes */
    ...
};
```

## GPIO configuration

```dts
/ {
    leds {
        compatible = "gpio-leds";
        led0: led_0 {
            gpios = <&gpio0 13 GPIO_ACTIVE_LOW>;
            label = "Green LED";
        };
    };
};
```

`&gpio0 13 GPIO_ACTIVE_LOW` means: port 0, pin 13, active when low. The `GPIO_ACTIVE_LOW` macro is defined in `<zephyr/dt-bindings/gpio/gpio.h>`.

## Aliases and labels

Two ways to reference a node from C:

```dts
/ {
    aliases {
        my-sensor = &sht31;  /* Create an alias */
    };
};
```

In C:
```c
/* By node label */
const struct device *dev = DEVICE_DT_GET(DT_NODELABEL(sht31));

/* By alias */
const struct device *dev = DEVICE_DT_GET(DT_ALIAS(my_sensor));
```

Note: DTS uses hyphens (`my-sensor`), C macros use underscores (`my_sensor`). Zephyr converts automatically.
