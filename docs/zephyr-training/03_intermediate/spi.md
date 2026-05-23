---
sidebar_position: 14
description: Read SPI sensors and displays from Zephyr — spi_config, SPI_DT_SPEC_GET, and transceive.
---

# SPI

SPI is the bus you'll use for anything that needs higher bandwidth than I2C — displays, SD cards, fast IMUs, flash chips. Four wires: clock (SCK), master-out (MOSI), master-in (MISO), and one chip-select (CS) per device.

:::info
References: [Zephyr SPI overview](https://docs.zephyrproject.org/latest/hardware/peripherals/spi.html) and the [SPI API doxygen](https://docs.zephyrproject.org/apidoc/latest/group__spi__interface.html).
:::

<br/>

---

## Enable SPI

```kconfig
CONFIG_SPI=y
```

ESP32-S3 has three SPI controllers: SPI0 and SPI1 are reserved for flash, **SPI2** and **SPI3** are free for your peripherals. Reference them as `&spi2` and `&spi3` in devicetree. nRF52840 exposes `SPI0`..`SPI3`, each with full-duplex DMA.

<br/>

---

## Devicetree — a SPI slave

```dts
&spi2 {
    status = "okay";
    cs-gpios = <&gpio0 10 GPIO_ACTIVE_LOW>;

    bme280: bme280@0 {
        compatible = "bosch,bme280";
        reg = <0>;                       /* CS index, not address */
        spi-max-frequency = <8000000>;   /* 8 MHz */
    };
};
```

The slave's `reg` is the index into `cs-gpios`, not an I2C-style address. SPI has no addressing — CS selects the device.

<br/>

---

## C code — raw transceive

If you're writing your own driver (no in-tree binding), use the raw SPI API:

```c
#include <zephyr/drivers/spi.h>

static const struct spi_dt_spec dev =
    SPI_DT_SPEC_GET(DT_NODELABEL(bme280),
                    SPI_WORD_SET(8) | SPI_TRANSFER_MSB, 0);

uint8_t tx_buf[] = {0xD0};   /* read ID register */
uint8_t rx_buf[1] = {0};

struct spi_buf tx = {.buf = tx_buf, .len = sizeof(tx_buf)};
struct spi_buf rx = {.buf = rx_buf, .len = sizeof(rx_buf)};
struct spi_buf_set tx_set = {.buffers = &tx, .count = 1};
struct spi_buf_set rx_set = {.buffers = &rx, .count = 1};

int ret = spi_transceive_dt(&dev, &tx_set, &rx_set);
```

The two helpers `spi_write_dt()` and `spi_read_dt()` are wrappers around `spi_transceive_dt()` with a null buffer on one side.

<br/>

---

## Operation flags

The second argument to `SPI_DT_SPEC_GET` is `spi_operation_t` — a bitmask:

| Flag | Meaning |
|---|---|
| `SPI_WORD_SET(8)` | 8-bit words (most peripherals) |
| `SPI_MODE_CPOL` | Clock idle-high |
| `SPI_MODE_CPHA` | Sample on second edge |
| `SPI_TRANSFER_MSB` | MSB first (most peripherals) |
| `SPI_OP_MODE_MASTER` | Master mode (default) |
| `SPI_HOLD_ON_CS` | Keep CS asserted across calls |

The peripheral's datasheet tells you which CPOL/CPHA combination it needs (often called "SPI mode 0/1/2/3").

<br/>

---

## Common mistakes

- **Wrong SPI mode** — most sensors are mode 0 (no `SPI_MODE_*` flags). If the device returns garbage, try mode 3 (`SPI_MODE_CPOL | SPI_MODE_CPHA`).
- **Forgot `cs-gpios`** — the binding has no idea which GPIO is CS unless you say so. Bus will run but no device will respond.
- **Speed too high on long wires** — start at 1 MHz when prototyping on a breadboard. SPI signal integrity falls off fast above a few MHz.
- **Sharing a bus, forgetting per-device speed** — each slave has its own `spi-max-frequency`. Zephyr reconfigures the controller per transaction.

:::tip
If a sensor has both I2C and SPI modes, prefer I2C for prototyping (fewer wires, easier to bus-multiple devices) and switch to SPI only when bandwidth becomes the bottleneck.
:::
