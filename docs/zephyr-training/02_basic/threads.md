---
sidebar_position: 6
description: Create Zephyr threads two ways — K_THREAD_DEFINE and k_thread_create — and run Hello EmbeddedFun alongside WS2812 concurrently.
---

# Threads

So far, your firmware does one thing at a time. The LED blinks — nothing else runs. The console prints — the LED waits.

Remember Hello World? That `printf` is still sitting there, replaced by WS2812 code. One or the other. Never both.

Real products don't work like that. They do ten things at once.

This is where the **RTOS** earns its name. Zephyr lets you run multiple **threads** — each one an independent loop, each one with its own stack. The kernel schedules them. They run concurrently. You stop thinking in "one loop" and start thinking in "jobs."

Here you will run Hello World and WS2812 — **at the same time**.

---

## Practical example: Hello EmbeddedFun + WS2812

The previous [WS2812](./ws2812) page ran everything in `main()`. Now split it into two independent threads, each created a different way:

| Thread | Method | Reason |
|---|---|---|
| `hello_thread` | `K_THREAD_DEFINE` | Always runs, no runtime data needed |
| `ws2812_thread` | `k_thread_create` | Started from `main()` after device setup |

```c title="src/main.c"
// SPDX-License-Identifier: Apache-2.0

#include <stdio.h>
#include <errno.h>
#include <string.h>

#define LOG_LEVEL 4
#include <zephyr/logging/log.h>
LOG_MODULE_REGISTER(main);

#include <zephyr/kernel.h>
#include <zephyr/drivers/led_strip.h>
#include <zephyr/device.h>
#include <zephyr/drivers/spi.h>
#include <zephyr/sys/util.h>

/* ── WS2812 setup ── */
#define STRIP_NODE DT_ALIAS(led_strip)

#if DT_NODE_HAS_PROP(DT_ALIAS(led_strip), chain_length)
#define STRIP_NUM_PIXELS DT_PROP(DT_ALIAS(led_strip), chain_length)
#else
#error Unable to determine length of LED strip
#endif

#define DELAY_TIME K_MSEC(CONFIG_SAMPLE_LED_UPDATE_DELAY)

#define RGB(_r, _g, _b) { .r = (_r), .g = (_g), .b = (_b) }

static const struct led_rgb colors[] = {
	RGB(CONFIG_SAMPLE_LED_BRIGHTNESS, 0x00, 0x00), /* red   */
	RGB(0x00, CONFIG_SAMPLE_LED_BRIGHTNESS, 0x00), /* green */
	RGB(0x00, 0x00, CONFIG_SAMPLE_LED_BRIGHTNESS), /* blue  */
};

static struct led_rgb pixels[STRIP_NUM_PIXELS];
static const struct device *const strip = DEVICE_DT_GET(STRIP_NODE);

#define STACK_SIZE      1024
#define HELLO_PRIORITY  5
#define WS2812_PRIORITY 5

/* ── Thread 1: Hello EmbeddedFun (K_THREAD_DEFINE) ── */
void hello_thread_fn(void *a, void *b, void *c)
{
	int count = 0;

	while (1) {
		printf("Hello EmbeddedFun from %s count=%d\n", CONFIG_BOARD, count++);
		k_sleep(K_SECONDS(1));
	}
}

K_THREAD_DEFINE(hello_tid, STACK_SIZE, hello_thread_fn,
		NULL, NULL, NULL, HELLO_PRIORITY, 0, 0);

/* ── Thread 2: WS2812 LED (k_thread_create) ── */
K_THREAD_STACK_DEFINE(ws2812_stack, STACK_SIZE);
static struct k_thread ws2812_thread_data;

void ws2812_thread_fn(void *a, void *b, void *c)
{
	size_t color = 0;
	int rc;

	if (device_is_ready(strip)) {
		LOG_INF("Found LED strip device %s", strip->name);
	} else {
		LOG_ERR("LED strip device %s is not ready", strip->name);
		return;
	}

	LOG_INF("Displaying pattern on strip");
	while (1) {
		for (size_t cursor = 0; cursor < ARRAY_SIZE(pixels); cursor++) {
			memset(&pixels, 0x00, sizeof(pixels));
			memcpy(&pixels[cursor], &colors[color], sizeof(struct led_rgb));

			rc = led_strip_update_rgb(strip, pixels, STRIP_NUM_PIXELS);
			if (rc) {
				LOG_ERR("couldn't update strip: %d", rc);
			}

			k_sleep(DELAY_TIME);
		}

		color = (color + 1) % ARRAY_SIZE(colors);
	}
}

/* ── main: spawn ws2812_thread, hello_thread already running ── */
int main(void)
{
	k_thread_create(&ws2812_thread_data, ws2812_stack,
			K_THREAD_STACK_SIZEOF(ws2812_stack),
			ws2812_thread_fn, NULL, NULL, NULL,
			WS2812_PRIORITY, 0, K_NO_WAIT);

	return 0;
}
```

---

## How does each method work?

### Way 1 — `k_thread_create`

Look at `ws2812_thread` in the example above. Three things are allocated explicitly:

```c
K_THREAD_STACK_DEFINE(ws2812_stack, STACK_SIZE);  /* stack buffer */
static struct k_thread ws2812_thread_data;         /* control block */
```

Then the thread is started from `main()` with `k_thread_create`. The thread begins **at the moment you call it** — giving you full control over when it starts.

### Way 2 — `K_THREAD_DEFINE`

Look at `hello_thread` in the example above. There is no `K_THREAD_STACK_DEFINE`, no `struct k_thread`, and no `k_thread_create` call in `main()`. A single macro replaces all three:

```c
K_THREAD_DEFINE(hello_tid, STACK_SIZE, hello_thread_fn,
		NULL, NULL, NULL, HELLO_PRIORITY, 0, 0);
```

The macro allocates the stack, allocates the control block, and registers the thread with the kernel — all at **compile time**. The last argument (`0`) is the delay in milliseconds before the thread starts. `0` means it starts as soon as the kernel is ready, **before `main()` runs**.

That is why `count=0` appears in the serial output before the WS2812 log lines — `hello_thread` was already running by the time `main()` created `ws2812_thread`.

### When to use which?

| | `K_THREAD_DEFINE` | `k_thread_create` |
|---|---|---|
| **Setup** | One macro | Stack + struct + create call |
| **Thread starts** | Before `main()` | When you call `k_thread_create` |
| **Arguments** | Fixed at compile time | Can be set at runtime |
| **Best for** | Simple threads that always run | Threads that start conditionally, need runtime data, or must start in a specific order |

**Rule of thumb:** reach for `K_THREAD_DEFINE` first. Switch to `k_thread_create` when you need to pass runtime data, delay startup, or start the thread based on a condition.

---

## Thread priorities

Lower number = higher priority. Priority `0` is the highest. Equal-priority threads are round-robin scheduled.

Both threads here use priority `5`. That is fine — they spend most of their time sleeping, so they never compete meaningfully.

:::warning[Stack overflow]
The most common threading bug in Zephyr. If your board resets or behaves strangely after adding a thread, increase `STACK_SIZE`. Enable `CONFIG_THREAD_ANALYZER=y` to measure actual stack usage.
:::

---

## prj.conf

Same as the [WS2812 page](./ws2812) — no extra config needed for threads.

```kconfig title="prj.conf"
CONFIG_LOG=y
CONFIG_LED_STRIP=y
CONFIG_LED_STRIP_LOG_LEVEL_DBG=y
```

## Build and flash

```bash
west build -b esp32s3_devkitc/esp32s3/procpu .
west flash
```

## Expected output

```
*** Booting Zephyr OS build v4.4.0 ***
Hello EmbeddedFun from esp32s3_devkitc/esp32s3/procpu count=0
[00:00:00.312] <inf> main: Found LED strip device ws2812@0
[00:00:00.312] <inf> main: Displaying pattern on strip
Hello EmbeddedFun from esp32s3_devkitc/esp32s3/procpu count=1
Hello EmbeddedFun from esp32s3_devkitc/esp32s3/procpu count=2
...
```

`hello_thread` starts before `main()` so `count=0` appears first. The LED log lines appear once `main()` creates `ws2812_thread`. After that, both run in parallel indefinitely — the board name printed alongside the count confirms which board the firmware is running on.

---

## What's next

Threads running in parallel eventually need to **share data**. The [Thread Synchronization](../intermediate/threads) page in Intermediate covers semaphores, mutexes, message queues, and work queues — the tools that keep shared state safe.

:::info[Official reference]
[Zephyr Kernel — Threads](https://docs.zephyrproject.org/latest/kernel/services/threads/index.html)
:::
