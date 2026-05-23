---
sidebar_position: 17
description: Ship firmware updates to fielded devices — MCUboot, image slots, and FOTA over BLE or WiFi.
---

# Bootloaders & DFU/FOTA

Once a device leaves your desk, the only way to fix bugs is **over-the-air updates**. The standard answer in Zephyr is **MCUboot**: a tiny bootloader that lives in flash before your application, verifies new images, and swaps them in.

:::info
References: [Zephyr DFU subsystem](https://docs.zephyrproject.org/latest/services/device_mgmt/dfu.html) and [Sysbuild](./sysbuild) for the build setup.
:::

<br/>

---

## The slot model

MCUboot splits your flash into:

| Partition | Purpose |
|---|---|
| `boot_partition` | MCUboot itself |
| `slot0_partition` | Currently-running app (the "primary" slot) |
| `slot1_partition` | Where new images land (the "secondary" slot) |
| `scratch_partition` | Temporary swap space (optional) |

A FOTA update writes the new image into slot1, marks it as a candidate, and reboots. MCUboot validates the signature, swaps slots, and runs the new image. If the new image doesn't confirm itself within a few boots, MCUboot reverts.

<br/>

---

## Enable MCUboot

In `sysbuild.conf`:

```kconfig
SB_CONFIG_BOOTLOADER_MCUBOOT=y
```

In your application `prj.conf`:

```kconfig
CONFIG_BOOTLOADER_MCUBOOT=y
CONFIG_MCUBOOT_SIGNATURE_KEY_FILE="bootloader/mcuboot/root-rsa-2048.pem"
```

:::warning
The default key in the MCUboot tree is **for development only** — it's public knowledge. Generate your own before shipping, or anyone can sign firmware your device will accept.
:::

Build:

```bash
west build -b esp32s3_devkitc --sysbuild
west flash
```

The application image is now signed and bootable by MCUboot.

<br/>

---

## Confirm a new image

After the first boot of a new image, your app must "confirm" it — otherwise MCUboot reverts on the next reboot:

```c
#include <zephyr/dfu/mcuboot.h>

if (!boot_is_img_confirmed()) {
    /* Run self-test here. Only confirm if everything works. */
    boot_write_img_confirmed();
}
```

This is the rollback safety net: ship a bug that crashes on boot, and the device automatically reverts to the last known-good image.

<br/>

---

## FOTA transports

The new image can arrive over any transport. Zephyr provides three out of the box:

| Transport | Use case | Kconfig |
|---|---|---|
| **BLE (SMP)** | Phone-based updates, low bandwidth | `CONFIG_MCUMGR_TRANSPORT_BT=y` |
| **WiFi/Ethernet (HTTP)** | Cloud-driven updates, fast | App-level — fetch and `flash_img_*` API |
| **UART (SMP)** | Wired updates from a host PC | `CONFIG_MCUMGR_TRANSPORT_UART=y` |

For BLE, the **mcumgr** subsystem handles the SMP protocol. The phone app sends image chunks; the device writes them to slot1 and the standard MCUboot flow takes over.

<br/>

---

## Sketch: BLE FOTA on ESP32-S3

```kconfig
# In prj.conf
CONFIG_BOOTLOADER_MCUBOOT=y
CONFIG_NET_BUF=y
CONFIG_ZCBOR=y
CONFIG_MCUMGR=y
CONFIG_MCUMGR_TRANSPORT_BT=y
CONFIG_MCUMGR_GRP_IMG=y
CONFIG_MCUMGR_GRP_OS=y
CONFIG_IMG_MANAGER=y
CONFIG_STREAM_FLASH=y
```

Pair with the **nRF Device Manager** app (iOS/Android — works on any device exposing the SMP service, not just nRF) and you can push a new `.bin` straight from your phone.

<br/>

---

## What can go wrong

| Symptom | Cause |
|---|---|
| Device boots into MCUboot but never starts the app | Image not signed, or signed with the wrong key |
| New image installs, then reverts on next boot | App never called `boot_write_img_confirmed()` |
| Update fails halfway, device bricks | No scratch partition + power loss during swap — use the **overwrite** algorithm for single-shot updates if rollback isn't required |
| Slot 1 too small | Slot 0 grew past slot 1's size — they must match. Re-partition. |

:::tip
Always test the full update path on real hardware before shipping. The combination of partition map, signing key, and confirm logic is impossible to validate without an end-to-end FOTA dry run.
:::
