---
sidebar_position: 4
description: Hardware and software watchdogs in Zephyr — never ship firmware without them.
---

# Watchdog

A watchdog timer resets the device if the firmware stops responding. It is the minimum viable recovery mechanism for any deployed device. If your firmware hangs in the field, the watchdog wakes it up.

**Rule: never ship firmware without a watchdog.**

## Hardware watchdog (WDT)

The ESP32 has a hardware watchdog peripheral. Zephyr exposes it through the `wdt` driver API:

```kconfig title="prj.conf"
CONFIG_WATCHDOG=y
```

```c title="src/watchdog.c"
#include <zephyr/drivers/watchdog.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(watchdog);

static const struct device *wdt = DEVICE_DT_GET(DT_ALIAS(watchdog0));
static int wdt_channel_id;

int watchdog_init(void)
{
    struct wdt_timeout_cfg wdt_config = {
        /* Reset SoC if watchdog fires */
        .flags = WDT_FLAG_RESET_SOC,
        /* Timeout: 5 seconds */
        .window.min = 0U,
        .window.max = 5000U,
    };

    if (!device_is_ready(wdt)) {
        LOG_ERR("WDT not ready");
        return -ENODEV;
    }

    wdt_channel_id = wdt_install_timeout(wdt, &wdt_config);
    if (wdt_channel_id < 0) {
        LOG_ERR("Cannot install WDT timeout: %d", wdt_channel_id);
        return wdt_channel_id;
    }

    wdt_setup(wdt, WDT_OPT_PAUSE_HALTED_BY_DBG);
    LOG_INF("Watchdog initialized, timeout 5s");
    return 0;
}

/* Call this periodically — at least once every 5 seconds */
void watchdog_feed(void)
{
    wdt_feed(wdt, wdt_channel_id);
}
```

## Feeding the watchdog from your main loop

```c
int main(void)
{
    watchdog_init();

    while (1) {
        do_work();          /* your application logic */
        watchdog_feed();    /* tell the WDT we're alive */
        k_sleep(K_SECONDS(1));
    }
}
```

## Devicetree alias

Add the watchdog alias to your overlay if it's not in the board DTS:

```dts
/ {
    aliases {
        watchdog0 = &wdt0;
    };
};

&wdt0 {
    status = "okay";
};
```

## What happens when the watchdog fires

On ESP32 with `WDT_FLAG_RESET_SOC`:
1. MCU resets
2. Firmware restarts from the beginning of `main()`
3. The reset reason is stored in the `RESETREAS` register — readable via `hwinfo_get_reset_cause()`

```c
#include <zephyr/drivers/hwinfo.h>

uint32_t reason;
hwinfo_get_reset_cause(&reason);
if (reason & RESET_WATCHDOG) {
    LOG_WRN("Device reset by watchdog — check for hang");
}
hwinfo_clear_reset_cause();
```

:::warning
`WDT_OPT_PAUSE_HALTED_BY_DBG` pauses the watchdog when the debugger halts the CPU. Without this flag, the watchdog fires every time you hit a breakpoint.
:::

## Production watchdog pattern

For production firmware with multiple threads, each thread feeds its own watchdog channel, and a supervisor thread checks they all reported in:

```c
/* Each thread reports to a bitmask */
#define THREAD_SENSOR_BIT  BIT(0)
#define THREAD_BLE_BIT     BIT(1)
#define ALL_THREADS_ALIVE  (THREAD_SENSOR_BIT | THREAD_BLE_BIT)

static atomic_t alive_mask = ATOMIC_INIT(0);

/* Each thread sets its bit before sleeping */
void sensor_thread(void *a, void *b, void *c) {
    while (1) {
        atomic_or(&alive_mask, THREAD_SENSOR_BIT);
        k_sleep(K_SECONDS(2));
    }
}

/* Supervisor: feed WDT only if all threads reported */
void watchdog_supervisor(void *a, void *b, void *c) {
    while (1) {
        if ((atomic_get(&alive_mask) & ALL_THREADS_ALIVE) == ALL_THREADS_ALIVE) {
            atomic_set(&alive_mask, 0);
            watchdog_feed();
        }
        k_sleep(K_SECONDS(1));
    }
}
```
