---
sidebar_position: 2
description: Create a Zephyr board definition for your own PCB — pin configuration, devicetree, and Kconfig defaults.
---

# Custom Board Support

When you move from a dev kit to your own PCB, you need a **board definition** — the set of files that tells Zephyr which pins are connected to what, which peripherals are enabled, and what the power-on defaults are.

## Board file structure

```
boards/arm/my_board/
├── my_board.dts          # Devicetree — pin assignments, peripherals
├── my_board.yaml         # Board metadata (arch, flash size, etc.)
├── my_board_defconfig    # Default Kconfig for this board
├── CMakeLists.txt        # Build integration
└── doc/
    └── index.rst         # Optional: board documentation
```

## Step 1: Create the DTS

Start by copying the closest upstream board (`esp32s3_devkitc`) and modifying it:

```bash
cp -r zephyr/boards/espressif/esp32s3_devkitc/esp32s3_devkitc.dts \
      boards/arm/my_board/my_board.dts
```

Edit the DTS to match your schematic:
- Remove LEDs/buttons you don't have
- Update I2C/SPI pin assignments to match your layout
- Add your custom peripherals

```dts title="boards/arm/my_board/my_board.dts"
/dts-v1/;
#include <espressif/esp32s3.dtsi>
#include "my_board-pinctrl.dtsi"

/ {
    model = "My Custom Board";
    compatible = "mycompany,my-board";

    chosen {
        zephyr,console = &uart0;
        zephyr,shell-uart = &uart0;
        zephyr,sram = &sram0;
        zephyr,flash = &flash0;
    };

    /* Your custom peripherals */
    leds {
        compatible = "gpio-leds";
        status_led: led_0 {
            gpios = <&gpio0 13 GPIO_ACTIVE_LOW>;
        };
    };
};

&i2c0 {
    status = "okay";
    /* SDA: GPIO21, SCL: GPIO22 — match your schematic */
    pinctrl-0 = <&i2c0_default>;
    pinctrl-names = "default";
    clock-frequency = <I2C_BITRATE_STANDARD>;
};
```

## Step 2: board.yaml

```yaml title="boards/arm/my_board/my_board.yaml"
identifier: my_board
name: My Custom Board
type: mcu
arch: arm
toolchain:
  - zephyr
  - gnuarmemb
ram: 256
flash: 1024
supported:
  - ble
  - gpio
  - i2c
  - spi
  - uart
  - usb_device
```

## Step 3: Kconfig defaults

```kconfig title="boards/arm/my_board/my_board_defconfig"
# SoC
CONFIG_SOC_SERIES_NRF52X=y
CONFIG_SOC_NRF52840_QIAA=y
CONFIG_BOARD_MY_BOARD=y

# Always-on for this board
CONFIG_GPIO=y
CONFIG_I2C=y
CONFIG_UART_CONSOLE=y
```

## Step 4: Build for your board

```bash
west build -b my_board app/
```

:::tip
Keep your board definition in your application repo under `boards/` — no need to submit to the Zephyr repo for internal boards. West picks up local board directories automatically with `--board-root`.
:::
