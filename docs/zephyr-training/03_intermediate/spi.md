---
sidebar_position: 15
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

Neither course board has an SPI sensor soldered on, so this page uses a module you wire up yourself: the **ADXL345** accelerometer — cheap, everywhere, with an in-tree binding (`adi,adxl345-spi.yaml`). Any SPI module works the same way.

<BoardTabs>
<BoardTab value="esp32s3_devkitc">

The DevKitC board devicetree already enables `&spi2` with its pins in pinctrl — **SCLK GPIO12, MOSI GPIO11, MISO GPIO13, CS GPIO10** (hardware chip-select). Wire the module there and add just the device node:

```dts title="boards/esp32s3_devkitc_procpu.overlay"
&spi2 {
	adxl345: adxl345@0 {
		compatible = "adi,adxl345";
		reg = <0>;                        /* CS0 = hardware CS, GPIO10 */
		spi-max-frequency = <1000000>;    /* 1 MHz while prototyping */
	};
};
```

</BoardTab>
<BoardTab value="efz_esp32s3">

The EFZ-ESP32S3 leaves `&spi2` disabled, so the overlay also routes its pins. Header **P3** has everything in one row: 3V3, **GPIO26 (CS)**, GPIO16, **GPIO15 (MISO)**, **GPIO14 (SCLK)**, **GPIO13 (MOSI)**, GND. (Skip GPIO16 — it's the TFT backlight.)

```dts title="boards/efz_esp32s3_procpu.overlay"
&pinctrl {
	spim2_default: spim2_default {
		group1 {
			pinmux = <SPIM2_MISO_GPIO15>,
				 <SPIM2_SCLK_GPIO14>;
		};

		group2 {
			pinmux = <SPIM2_MOSI_GPIO13>;
			output-low;
		};
	};
};

&spi2 {
	#address-cells = <1>;
	#size-cells = <0>;
	status = "okay";
	pinctrl-0 = <&spim2_default>;
	pinctrl-names = "default";
	cs-gpios = <&gpio0 26 GPIO_ACTIVE_LOW>;   /* CS on GPIO26 */

	adxl345: adxl345@0 {
		compatible = "adi,adxl345";
		reg = <0>;                        /* index 0 into cs-gpios */
		spi-max-frequency = <1000000>;    /* 1 MHz while prototyping */
	};
};
```

</BoardTab>
</BoardTabs>

The slave's `reg` is a chip-select index, not an I2C-style address. SPI has no addressing — CS selects the device. With `cs-gpios`, `reg = <0>` means "the first GPIO in that list"; without it, the ESP32-S3 uses the controller's own hardware CS line from pinctrl (`SPIM2_CSEL_...`).

<br/>

---

## C code — raw transceive

If you're writing your own driver (or just poking a chip during bring-up), use the raw SPI API. This reads the ADXL345's ID register, which always answers `0xE5`:

```c title="src/main.c"
#include <zephyr/kernel.h>
#include <zephyr/drivers/spi.h>

#define ADXL345_READ   0x80   /* bit 7 set = read */
#define ADXL345_DEVID  0x00   /* ID register, always reads 0xE5 */

static const struct spi_dt_spec adxl =
    SPI_DT_SPEC_GET(DT_NODELABEL(adxl345),
                    SPI_WORD_SET(8) | SPI_TRANSFER_MSB |
                    SPI_MODE_CPOL | SPI_MODE_CPHA);   /* ADXL345 = SPI mode 3 */

int main(void)
{
    /* Full duplex: byte 0 sends the command, byte 1 clocks the answer in */
    uint8_t tx_buf[2] = {ADXL345_READ | ADXL345_DEVID, 0x00};
    uint8_t rx_buf[2] = {0};

    struct spi_buf tx = {.buf = tx_buf, .len = sizeof(tx_buf)};
    struct spi_buf rx = {.buf = rx_buf, .len = sizeof(rx_buf)};
    struct spi_buf_set tx_set = {.buffers = &tx, .count = 1};
    struct spi_buf_set rx_set = {.buffers = &rx, .count = 1};

    if (!spi_is_ready_dt(&adxl)) {
        printk("SPI bus not ready\n");
        return 0;
    }

    int ret = spi_transceive_dt(&adxl, &tx_set, &rx_set);

    printk("ret=%d  DEVID=0x%02x (expect 0xe5)\n", ret, rx_buf[1]);
    return 0;
}
```

Why two bytes? SPI is full duplex — the chip can't answer during the same byte it's still receiving the command. The first byte of `rx_buf` is junk clocked in while the command went out; the answer arrives in the second.

`prj.conf` only needs `CONFIG_SPI=y`. The in-tree ADXL345 *sensor* driver stays out of the build because `CONFIG_SENSOR` isn't enabled — here you're talking to the chip directly.

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
- **No chip-select** — Zephyr has no idea which pin is CS unless you say so: either `cs-gpios` on the controller, or (on the ESP32-S3) a hardware CS pin like `SPIM2_CSEL_GPIO10` in pinctrl. Without one, the bus runs but no device responds.
- **Speed too high on long wires** — start at 1 MHz when prototyping on a breadboard. SPI signal integrity falls off fast above a few MHz.
- **Sharing a bus, forgetting per-device speed** — each slave has its own `spi-max-frequency`. Zephyr reconfigures the controller per transaction.

:::tip
If a sensor has both I2C and SPI modes, prefer I2C for prototyping (fewer wires, easier to bus-multiple devices) and switch to SPI only when bandwidth becomes the bottleneck.
:::
