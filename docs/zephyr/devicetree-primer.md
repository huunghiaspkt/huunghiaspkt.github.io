---
title: Devicetree Overlays Explained
sidebar_label: Devicetree Primer
---

# Devicetree Overlays Explained

_With a real ESP32 board as the example._

Zephyr uses devicetree (DTS) to describe hardware to the kernel — which pins are I2C, which
address a sensor lives at, what the pin configuration is. If you've never seen it before, it
looks like structured config but behaves more like a type system: the `compatible` property
binds a DTS node to a specific C driver.

This is the mental model that took me the longest to build. Here it is, compressed.

---

## The three-layer model

There are three DTS inputs that Zephyr merges at build time:

```
SoC DTS            Board DTS              Your overlay
(esp32s3.dtsi) +  (esp32s3_devkitc.dts) + (boards/esp32s3_devkitc_esp32s3_procpu.overlay)
     |                     |                          |
     +---------------------+--------------------------+
                           |
                    Final device tree
```

- **SoC DTS**: defines all peripherals on the chip (`i2c0`, `spi1`, `uart0`, etc.) with vendor defaults. You never edit this.
- **Board DTS**: enables the peripherals the board uses and maps them to physical pins. The DK files live in `boards/espressif/esp32s3_devkitc/` in the Zephyr repo.
- **Your overlay**: overrides and additions specific to your application. This is what you write.

---

## A minimal I2C sensor overlay

```dts title="boards/esp32s3_devkitc_esp32s3_procpu.overlay"
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_STANDARD>;

    sht31: sht3xd@44 {
        compatible = "sensirion,sht3xd";
        reg = <0x44>;
    };
};
```

**Breaking it down:**

`&i2c0` — the `&` means "reference an existing node" (defined in the board DTS). You're not
creating a new `i2c0`, you're modifying the one the board defines.

`status = "okay"` — Zephyr's convention for "this peripheral is in use." Nodes default to
`disabled`. If you forget this, your driver won't initialize and you'll see
`i2c0: could not get binding`.

`clock-frequency = <I2C_BITRATE_STANDARD>` — expands to `100000` (100 kHz). The macro is
defined in `zephyr/drivers/i2c.h`. Use `I2C_BITRATE_FAST` for 400 kHz.

`sht3xd@44` — the node name. The `@44` is the unit address, which must match `reg`. It's hex,
so `@44` = 0x44.

`compatible = "sensirion,sht3xd"` — the binding string. Zephyr looks up
`dts/bindings/sensor/sensirion,sht3xd.yaml` to validate this node and generate the matching
`device` struct. This is how the DTS node gets connected to the C driver.

`reg = <0x44>` — the I2C address. For 7-bit addresses, write the 7-bit value (not the 8-bit
read/write shifted form). The driver handles the shift.

---

## Getting the device in C

After the DTS is set up, retrieving the device in your application:

```c
/* Option 1: by node label (preferred) */
static const struct device *sht31 = DEVICE_DT_GET(DT_NODELABEL(sht31));

/* Option 2: by compatible string (if there's only one) */
static const struct device *sht31 = DEVICE_DT_GET_ONE(sensirion_sht3xd);

/* Always check it initialized */
if (!device_is_ready(sht31)) {
    LOG_ERR("SHT31 not ready — check overlay and CONFIG_SHT3XD=y");
    return -ENODEV;
}
```

The `DEVICE_DT_GET` macro resolves at compile time — if the node doesn't exist in the DTS,
you get a build error, not a runtime NULL. This is one of Zephyr's nicest properties.

---

## Common mistakes

**1. Forgetting `status = "okay"`**

The peripheral exists in the board DTS but is `disabled`. Your overlay enables it by adding
`status = "okay"`. Without it: device never initializes, `device_is_ready()` returns false.

**2. Mismatched `compatible` and driver Kconfig**

`compatible = "sensirion,sht3xd"` requires `CONFIG_SHT3XD=y` in `prj.conf`. If the config
is missing, the driver isn't compiled and the device won't bind. The error looks like:
`sht3xd: binding not found`.

**3. Node address doesn't match `reg`**

`sht3xd@44` with `reg = <0x45>` is a DTS validation error. They must match. The `@` address
is decorative (Zephyr uses `reg` for actual addressing) but they must be identical.

**4. Using 8-bit I2C address instead of 7-bit**

The SHT31's datasheet says "I2C address 0x88 (write) / 0x89 (read)." In DTS, use the 7-bit
form: `0x44`. Zephyr's I2C drivers shift the address themselves.

---

## Checking what the build sees

```bash
west build -b esp32s3_devkitc/esp32s3/procpu -- -DOVERLAY_CONFIG=overlay.conf
cat build/zephyr/zephyr.dts   # merged final DTS
```

The `zephyr.dts` file in the build directory is the fully resolved device tree. Grep for your
node name to confirm it's present and has the right properties:

```bash
grep -A10 "sht3xd" build/zephyr/zephyr.dts
```
