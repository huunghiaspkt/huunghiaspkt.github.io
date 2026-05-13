---
sidebar_position: 3
description: Understand Kconfig — how Zephyr's configuration system enables and sizes drivers and subsystems.
---

# Kconfig

Kconfig is the configuration system Zephyr inherited from the Linux kernel. It controls which drivers, subsystems, and features are compiled into your firmware.

Every Zephyr feature — I2C, BLE, USB, logging — is gated behind a `CONFIG_` symbol. If `CONFIG_I2C=n`, the I2C driver is not compiled and takes zero flash space.

## Your project's prj.conf

```kconfig title="prj.conf"
# Enable I2C
CONFIG_I2C=y

# Enable the SHT3x sensor driver
CONFIG_SENSOR=y
CONFIG_SHT3XD=y

# BLE peripheral role
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_DEVICE_NAME="MyDevice"

# Logging (3 = info level)
CONFIG_LOG=y
CONFIG_LOG_DEFAULT_LEVEL=3
```

## How Kconfig values are resolved

Zephyr merges multiple Kconfig files in order:

1. **SoC defaults** — from the chip definition (`esp32.conf`)
2. **Board defaults** — from the board definition (`esp32_devkitc_wroom.conf`)
3. **Your `prj.conf`** — your application overrides

Values in `prj.conf` override everything upstream. If you set `CONFIG_LOG_DEFAULT_LEVEL=4`, it overrides the board default.

:::info
To see all resolved Kconfig values after a build: `cat build/zephyr/.config`. This is the definitive record of what your firmware has enabled.
:::

## Common Kconfig types

| Symbol type | Example | Meaning |
|---|---|---|
| `bool` | `CONFIG_I2C=y` | Enable/disable a feature |
| `int` | `CONFIG_BT_MAX_CONN=4` | Numeric value |
| `string` | `CONFIG_BT_DEVICE_NAME="Node"` | String value |
| `hex` | `CONFIG_SRAM_SIZE=0x40000` | Hex value |

## Browsing available symbols

```bash
# Launch the Kconfig GUI (requires Python and tkinter)
west build -t menuconfig

# Or the simpler ncurses version
west build -t guiconfig
```

Both show the full tree of available symbols with their current values and help text.

## Dependency-driven Kconfig

Symbols have dependencies. If you enable `CONFIG_SHT3XD=y` but forget `CONFIG_SENSOR=y`, the build will fail with a missing symbol error. Check the driver's `Kconfig` file for its `depends on` line:

```kconfig
config SHT3XD
    bool "SHT3XD Temperature and Humidity Sensor"
    depends on SENSOR
    depends on I2C
```

:::warning
`CONFIG_SHT3XD=y` in `prj.conf` alone is not enough. Always check `depends on` and enable the chain.
:::
