---
sidebar_position: 5
description: How Zephyr's CMake + Ninja build system works, and common build flags you'll use every day.
---

# The Build System

Zephyr uses **CMake** as its build system generator and **Ninja** as the build tool. You almost never write CMake directly — West handles it.

## Build output files

After `west build`, the `build/zephyr/` directory contains:

| File | Description |
|---|---|
| `zephyr.elf` | ELF binary with debug symbols — used by GDB |
| `zephyr.hex` | Intel HEX for flashing |
| `zephyr.bin` | Raw binary |
| `zephyr.dts` | Merged, final devicetree — read this to debug DT issues |
| `.config` | Final resolved Kconfig — read this to debug config issues |
| `zephyr.map` | Linker map — shows flash/RAM usage per symbol |

## Checking memory usage

```bash
# After build, print flash and RAM usage
west build -b esp32_devkitc_wroom . && \
  cat build/zephyr/zephyr.stat
```

Or with the size tool:
```bash
arm-zephyr-eabi-size build/zephyr/zephyr.elf
```

Output:
```
   text    data     bss     dec     hex filename
  42312     312    6248   48872    bf08 build/zephyr/zephyr.elf
```

- `text` = flash used by code and read-only data
- `data` = RAM used by initialized variables (also stored in flash)
- `bss` = RAM used by zero-initialized variables

## Useful build flags

```bash
# Build with a custom overlay file
west build -b esp32_devkitc_wroom . -- \
  -DDTC_OVERLAY_FILE=boards/esp32_devkitc_wroom.overlay

# Override a Kconfig value without editing prj.conf
west build -b esp32_devkitc_wroom . -- \
  -DCONFIG_LOG_DEFAULT_LEVEL=4

# Force a full clean rebuild
west build --pristine

# Build with verbose output (see every compiler command)
west build -b esp32_devkitc_wroom . -- -DCMAKE_VERBOSE_MAKEFILE=ON
```

:::note
`--` separates `west build` arguments from CMake arguments. Everything after `--` is passed directly to CMake.
:::

## Build-time errors vs. runtime errors

This distinction matters:

| Error type | When it happens | How to debug |
|---|---|---|
| Kconfig error | `west build` fails | Check `depends on` chain in the driver's `Kconfig` file |
| DTS error | `west build` fails | Check `build/zephyr/zephyr.dts` after fixing |
| Linker error | `west build` fails | Usually a missing `CONFIG_` or wrong `target_sources()` |
| Runtime panic | Board crashes | Use `west rtt` or `west debug` + GDB |

:::tip
When a Zephyr build fails with a cryptic error, the first thing to check is `build/zephyr/.config` (Kconfig) and `build/zephyr/zephyr.dts` (devicetree). The build system writes these intermediate files before compilation — they show exactly what Zephyr assembled.
:::
