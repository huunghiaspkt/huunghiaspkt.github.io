---
sidebar_position: 16
description: Build multiple firmware images together with Sysbuild — app, bootloader, and network core in one west build.
---

# Sysbuild

A simple Zephyr build produces one binary. The moment you add a bootloader (MCUboot), a TrustZone secure image, or a separate network-core firmware, you're building **multiple images that need to be coordinated** — same key, same partition map, flashed in the right order.

That's what Sysbuild does. It's a meta-build that drives several CMake builds from one `west build` invocation.

:::info
Reference: [Sysbuild documentation](https://docs.zephyrproject.org/latest/build/sysbuild/index.html).
:::

<br/>

---

## Enable Sysbuild

Per-build:

```bash
west build -b esp32s3_devkitc --sysbuild
```

Or make it the default for this checkout:

```bash
west config build.sysbuild True
```

Once enabled, `west build` runs Sysbuild instead of building a single image.

<br/>

---

## Add MCUboot to your build

The most common Sysbuild use case is "build my app **and** an MCUboot bootloader, same key, same partition table."

Create `sysbuild.conf` in your application root:

```kconfig
SB_CONFIG_BOOTLOADER_MCUBOOT=y
```

Then:

```bash
west build -b esp32s3_devkitc --sysbuild
west flash
```

The build output now contains two images:

```
build/
├── mcuboot/         # bootloader
└── my_app/          # signed application
```

`west flash` programs both in the correct order.

<br/>

---

## Configure the application image

Sysbuild Kconfig symbols (in `sysbuild.conf`) use the `SB_CONFIG_` prefix. To set a Kconfig in a specific image, prefix the symbol with the image name:

```bash
west build -b esp32s3_devkitc --sysbuild \
  -- -Dmy_app_CONFIG_LOG_DEFAULT_LEVEL=4
```

Or in `sysbuild.conf`:

```
my_app_CONFIG_LOG_DEFAULT_LEVEL=4
```

The image name is the directory name of the app — the same name that shows up under `build/`.

<br/>

---

## Multi-core builds (nRF53/nRF54)

Nordic's dual-core SoCs need this even without a bootloader. The application core runs your code; the network core runs the BLE controller. Sysbuild builds both:

```kconfig
SB_CONFIG_NETCORE_HCI_IPC=y
```

This pulls in the `hci_ipc` sample as the network-core image automatically. ESP32-S3 is single-core (well, dual-core symmetric), so this lesson is more about preparing you for what you'll see on nRF parts.

<br/>

---

## Why this matters

Before Sysbuild, multi-image builds used **child images** — a fragile mechanism where you crammed extra config into your main app's `prj.conf`. Sysbuild replaces that with a clean separation: each image is its own build, and `sysbuild.conf` glues them together.

:::tip
If you're staying on a single-image build (no bootloader, single core), you don't need Sysbuild. Add it the moment you bring in MCUboot, TF-M, or a separate radio core — that's the threshold where the coordination pays off.
:::
