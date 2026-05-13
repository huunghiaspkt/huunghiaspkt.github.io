---
sidebar_position: 3

description: Understand the structure of a Zephyr application and build your first Hello World.
---

# Hello World

Every Zephyr application has the same three-file structure. Once you understand it, every project you encounter will feel familiar.

## The minimal project

```
my_app/
├── CMakeLists.txt    # Build system entry point
├── prj.conf          # Kconfig configuration
└── src/
    └── main.c        # Application code
```

### CMakeLists.txt

```cmake title="CMakeLists.txt"
cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(hello_world)

target_sources(app PRIVATE src/main.c)
```

The `find_package(Zephyr ...)` line is what connects your application to the Zephyr build system. West sets the `ZEPHYR_BASE` environment variable automatically.

### prj.conf

```kconfig title="prj.conf"
# Enable USB console for Hello World output
CONFIG_USB_DEVICE_STACK=y
CONFIG_USB_CDC_ACM=y
CONFIG_UART_LINE_CTRL=y

# Logging
CONFIG_LOG=y
```

### main.c

```c title="src/main.c"
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(main, LOG_LEVEL_INF);

int main(void)
{
    LOG_INF("Hello, Zephyr!");

    while (1) {
        k_sleep(K_SECONDS(1));
        LOG_INF("tick");
    }

    return 0;
}
```

## Build and run

```bash
# Build for the ESP32 DK
west build -b esp32_devkitc_wroom .

# Flash to the board
west flash

# Open the debug console (RTT)
west rtt
```

Expected output:
```
*** Booting Zephyr OS build v3.7.0 ***
[00:00:00.006,000] <inf> main: Hello, Zephyr!
[00:00:01.006,000] <inf> main: tick
[00:00:02.006,000] <inf> main: tick
```

:::tip
The timestamp `[00:00:00.006,000]` is in `seconds.milliseconds,microseconds` format. Zephyr's logging system uses the system uptime clock.
:::

## What `west build` actually does

1. Reads `CMakeLists.txt` and finds `find_package(Zephyr)`
2. Merges all Kconfig files into `build/zephyr/.config`
3. Compiles the final devicetree into `build/zephyr/zephyr.dts`
4. Compiles all source files and links `zephyr.elf`
5. Produces `zephyr.hex` (ready for flashing)

:::info
The build directory (`build/`) is reusable. Run `west build` again after changing `main.c` and it does an incremental rebuild — only changed files are recompiled.
:::
