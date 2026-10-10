---
sidebar_position: 4.6
title: "Console & Logging"
description: "Print with printk and its format specifiers, fix the *float* placeholder, then switch to Zephyr's logger: register a log module, declare it in other files, and pick a log level."
outcomes: [LO9]
module: W2
verified: "fork main · efz_samples/02_basic/basic_logger · board efz_esp32s3 rev 1 · 2026-10-09"
---

# Console & Logging

When your firmware misbehaves, the first thing you do is print something. Zephyr gives you two ways: **`printk`** for a quick check, and the **logger** for messages you want to keep. You'll use one sample for both: start it with `printk`, then switch the same app to the logger.

## By the end of this lesson you can

- Format numbers, strings and pointers with `printk`, and make `%f` print a real number.
- Turn the logger on, register a log module in one file and declare it in the others.
- Read a log line: time, level, module, message.
- Pick a log level, and know what it costs.

<LessonMeta time="about 30 minutes" need="the EFZ and its USB cable (the DevKitC runs it too)" before="Buttons & LEDs" beforeHref="./buttons-leds" />

<br/>

---

## Part 1: printk

**Code:** `zephyr/samples/efz_samples/02_basic/basic_logger`.

<br/>

### Step 1 — Replace main.c with printk code

The sample is a logger app. For this first part, turn the logger off: empty `prj.conf`, so the file has no lines at all. Then replace `src/main.c` with this:

```c title="zephyr/samples/efz_samples/02_basic/basic_logger/src/main.c"
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

int main(void)
{
	int temperature = -7;
	unsigned int reg = 0x2c;
	const char *board = CONFIG_BOARD_TARGET;
	float voltage = 3.3f;

	printk("Board: %s\n", board);
	printk("Signed %d, unsigned %u\n", temperature, (unsigned int)temperature);
	printk("Register 0x%02x, padded 0x%08x\n", reg, reg);
	printk("Character '%c', pointer %p\n", 'Z', (void *)&reg);
	printk("Uptime %lld ms\n", k_uptime_get());
	printk("Voltage %f V\n", (double)voltage);
	printk("Voltage %d.%02d V\n", (int)voltage, (int)(voltage * 100) % 100);
	return 0;
}
```

`printk` works like C's `printf`, and it's always on: there's nothing to set up.

<br/>

### Step 2 — Build, flash, and read the output

<BoardTabs>
<BoardTab value="efz_esp32s3">

```bash
west build -b efz_esp32s3/esp32s3/procpu zephyr/samples/efz_samples/02_basic/basic_logger -p
west flash
```

</BoardTab>
<BoardTab value="esp32s3_devkitc">

```bash
west build -b esp32s3_devkitc/esp32s3/procpu zephyr/samples/efz_samples/02_basic/basic_logger -p
west flash
```

</BoardTab>
</BoardTabs>

```text title="Serial console (EFZ)"
*** Booting Zephyr OS build ... ***
Board: efz_esp32s3/esp32s3/procpu
Signed -7, unsigned 4294967289
Register 0x2c, padded 0x0000002c
Character 'Z', pointer 0x3fc91c00
Uptime 2 ms
Voltage *float* V
Voltage 3.30 V
```

Line by line:

- **`%s`** prints a string: the board this was built for.
- **`%d` and `%u`** print the same bits of −7 as signed and as unsigned. As unsigned, they read 4294967289. The format specifier decides how the bits are printed, whatever the variable's type.
- **`%02x` and `%08x`** print hex, padded with zeros to 2 and 8 digits. Handy for register values.
- **`%c`** prints a character, and **`%p`** an address.
- **`%lld`**: the uptime is a 64-bit number, so it needs `ll`.
- **`*float*`** isn't a bug in your code. By default Zephyr leaves floating-point support out of the formatter, to keep the image small, and prints this placeholder instead.
- The last line is the workaround: print the whole part and the fraction as integers.

<br/>

### Step 3 — Turn float support on

Add one line to `prj.conf`:

```ini title="zephyr/samples/efz_samples/02_basic/basic_logger/prj.conf"
CONFIG_CBPRINTF_FP_SUPPORT=y
```

Build and flash again. Now the `%f` line prints the number, with six decimals:

```text
Voltage 3.300000 V
```

The image grows a little (832 bytes on the EFZ), so turn it on only when you need it.

<br/>

---

## Part 2: The logger

<br/>

### Step 1 — Switch main.c to the logger

Replace `src/main.c` with the sample's logger code. It's the file the sample came with, so `git -C zephyr restore samples/efz_samples/02_basic/basic_logger/src/main.c` puts it back too.

```c title="zephyr/samples/efz_samples/02_basic/basic_logger/src/main.c"
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include "counter.h"

LOG_MODULE_REGISTER(app, LOG_LEVEL_INF);

int main(void)
{
	LOG_ERR("This is an error");
	LOG_WRN("This is a warning");
	LOG_INF("This is information");
	LOG_DBG("This is a debug message");

	for (int count = 0; ; count++) {
		counter_show(count);
		k_msleep(1000);
	}

	return 0;
}
```

<br/>

### Step 2 — Turn the logger on

Add a second line to `prj.conf`:

```ini title="zephyr/samples/efz_samples/02_basic/basic_logger/prj.conf"
CONFIG_CBPRINTF_FP_SUPPORT=y
CONFIG_LOG=y
```

<br/>

### Step 3 — Register a module, declare it elsewhere

```c
LOG_MODULE_REGISTER(app, LOG_LEVEL_INF);
```

**`LOG_MODULE_REGISTER`** creates a log module called `app`, with the level `info`. Every line this file logs carries that name, so you can tell where a message came from.

The sample has a second source file. It logs through the same module:

```c title="zephyr/samples/efz_samples/02_basic/basic_logger/src/counter.c"
#include <zephyr/logging/log.h>
#include "counter.h"

LOG_MODULE_DECLARE(app);

void counter_show(int count)
{
	LOG_INF("Count %d", count);
}
```

**`LOG_MODULE_DECLARE`** says "use the module registered somewhere else". Register a module **once**, in one file, and declare it in every other file that uses it. Registering it twice doesn't build: the linker stops with `multiple definition of 'log_const_app'`.

`LOG_MODULE_DECLARE` can take a level too. Without one, that file logs at the default level, info.

<br/>

### Step 4 — Levels

The level is the second argument of `LOG_MODULE_REGISTER`. There are five:

| Level | Macro | Use it for |
|---|---|---|
| `LOG_LEVEL_NONE` | — | nothing is logged |
| `LOG_LEVEL_ERR` | `LOG_ERR` | something failed |
| `LOG_LEVEL_WRN` | `LOG_WRN` | something looks wrong, but the code carries on |
| `LOG_LEVEL_INF` | `LOG_INF` | normal events |
| `LOG_LEVEL_DBG` | `LOG_DBG` | details you only want while developing |

A module prints its own level and everything more serious. At `info`, the `LOG_DBG` call is compiled out: it costs nothing.

<br/>

### Step 5 — Build, flash, and read a log line

Build and flash with the same commands as in Part 1.

```text title="Serial console (EFZ)"
*** Booting Zephyr OS build ... ***
[00:00:00.000,000] <err> app: This is an error
[00:00:00.000,000] <wrn> app: This is a warning
[00:00:00.000,000] <inf> app: This is information
[00:00:00.000,000] <inf> app: Count 0
[00:00:01.000,000] <inf> app: Count 1
[00:00:02.000,000] <inf> app: Count 2
[00:00:03.000,000] <inf> app: Count 3
```

Read a line from left to right: the time since boot, the level, the module, then the message. Errors show in red and warnings in yellow. The count lines come from `counter.c`, and they say `app` too, because both files share one module. The debug message isn't there.

Unlike `printk`, a log call doesn't print right away. It copies the message into a buffer, and the logger's own thread prints it later. So it's cheap, and safe even in an interrupt.

<br/>

### Step 6 — Raise the level to debug

In `main.c`, change `LOG_LEVEL_INF` to `LOG_LEVEL_DBG`, then build and flash again. Now the debug line shows up too. Zephyr adds the function's name to debug lines:

```text
[00:00:00.000,000] <dbg> app.main: This is a debug message
```

Set it back to `LOG_LEVEL_INF`, and the debug call is compiled out again.

<br/>

---

## Check your work

1. **You should see:** the error, warning and info lines once, then a count line every second.
2. **Change it:** set the level to `LOG_LEVEL_WRN` in `main.c`, then build and flash. The information line is gone, but the counter still prints: the level applies to each file, and `counter.c` logs at the default level. Now give its declare a level too:

   ```c title="zephyr/samples/efz_samples/02_basic/basic_logger/src/counter.c"
   LOG_MODULE_DECLARE(app, LOG_LEVEL_WRN);
   ```

3. **It works when:** only the error and warning lines print, and the counter goes quiet:

   ```text
   [00:00:00.000,000] <err> app: This is an error
   [00:00:00.000,000] <wrn> app: This is a warning
   ```

<details>
<summary>Stuck?</summary>

- **`*float*` instead of a number** → floating-point formatting is off by default → add `CONFIG_CBPRINTF_FP_SUPPORT=y` to `prj.conf` (Part 1, Step 3).
- **`multiple definition of 'log_const_app'`** → the module is registered in two files → keep `LOG_MODULE_REGISTER` in one file and use `LOG_MODULE_DECLARE` in the others.
- **No log lines at all, but the app runs** → `CONFIG_LOG=y` is missing from `prj.conf`.
- **Strange characters like `[1;31m` around lines** → your terminal doesn't understand colour codes → use one that does, or set `CONFIG_LOG_BACKEND_SHOW_COLOR=n`.

</details>

<br/>

---

## What's next

[WS2812 RGB LED](./ws2812) drives the board's RGB LED through the LED strip API, with an overlay of your own.
