---
sidebar_position: 4
description: Learn about west, the Zephyr meta-tool for workspace management and building.
---

# West

West is the meta-tool that ships with Zephyr. It does two things:

1. **Workspace management** — clones Zephyr and all its dependencies at the exact right versions
2. **Build and flash CLI** — wraps `cmake`, `ninja`, and your programmer into single commands

## West manifests

Every Zephyr application has a `west.yml` manifest file that pins exact Git commit hashes for Zephyr and every dependency. This means your project will build correctly 2 years from now, with the same Zephyr version.

```bash
# Initialize a workspace from a manifest
west init -m https://github.com/zephyrproject-rtos/zephyr --mr v3.7.0 ~/zephyrproject

# Pull all dependencies listed in west.yml
cd ~/zephyrproject && west update

# Make Zephyr's CMake packages findable
west zephyr-export
```

:::note
Always use `west init` instead of `git clone` when setting up a Zephyr project. `west init` registers the manifest location so that `west update` always restores the correct dependency tree.
:::

## Build and flash

The two commands you use every day:

```bash
# Build for a target board
west build -b esp32_devkitc_wroom app/

# Flash to connected hardware
west flash
```

West figures out which compiler, linker, and programmer to use based on the board you specify. You never need to set `PATH` or pick a toolchain manually.

## Useful west commands

```bash
# List all boards supported by Zephyr
west boards

# List all boards matching a filter
west boards | grep nrf52

# Build with a devicetree overlay
west build -b esp32_devkitc_wroom app/ -- \
  -DDTC_OVERLAY_FILE=boards/esp32_devkitc_wroom.overlay

# Open RTT debug console (requires J-Link)
west rtt

# Inspect the final merged devicetree
cat build/zephyr/zephyr.dts
```

## Updating Zephyr

```bash
# Update all modules to latest versions in the manifest
west update

# Switch to a different Zephyr release
west update --mr v3.7.0
```

:::warning
After running `west update`, always rebuild from scratch. Cached build artifacts from the old Zephyr version will cause subtle build failures.
:::
