---
sidebar_position: 6
title: "Threads"
description: "Run three threads at once with Zephyr's threads sample: two blink LED1 and LED2 at their own speed, a third prints what they report through a FIFO."
outcomes: [LO4]
module: W4
verified: "fork main · efz_samples/02_basic/threads (from samples/basic/threads) · board efz_esp32s3 rev 1 · 2026-10-12"
---

# Threads

So far, the firmware did one thing at a time, inside `main()`. A **thread** (a *task* in other RTOSes like FreeRTOS) is how your firmware does several things at once. Each thread is its own loop with its own stack, and the kernel switches between them, so they seem to run at the same time.

In this lesson you run three: two blink LED1 and LED2 at their own speed, and a third prints what they report.

## By the end of this lesson you can

- Create threads at build time with `K_THREAD_DEFINE`, and say what its stack size and priority mean.
- Pass data from one thread to another through a FIFO.
- Predict from the code what the console and the LEDs do, and check it on the board.

<LessonMeta time="about 20 minutes" need="the EFZ and its USB cable" before="WS2812 RGB LED" beforeHref="/docs/zephyr-training/basic/ws2812" />

<br/>

---

## The sample

**Code:** `zephyr/samples/efz_samples/02_basic/threads`, a copy of Zephyr's `samples/basic/threads`.

```
threads/
├── CMakeLists.txt
├── prj.conf
└── src/
    └── main.c
```

There's no overlay: the EFZ board file already has LED1 and LED2 as the aliases `led0` and `led1`.

<br/>

### Step 1 — Three threads, no `main()`

Start at the bottom of `main.c`:

```c title="zephyr/samples/efz_samples/02_basic/threads/src/main.c"
K_THREAD_DEFINE(blink0_id, STACKSIZE, blink0, NULL, NULL, NULL,
		PRIORITY, 0, 0);
K_THREAD_DEFINE(blink1_id, STACKSIZE, blink1, NULL, NULL, NULL,
		PRIORITY, 0, 0);
K_THREAD_DEFINE(uart_out_id, STACKSIZE, uart_out, NULL, NULL, NULL,
		PRIORITY, 0, 0);
```

Three lines, three threads, and the file has no `main()` at all. `K_THREAD_DEFINE` builds each thread when the firmware is compiled, and the kernel starts it when the board boots. The arguments are the thread's name, its stack size, the function it runs, three arguments for that function, its priority, its options, and a start delay (0 = start right away).

<br/>

### Step 2 — Stack size and priority

```c title="zephyr/samples/efz_samples/02_basic/threads/src/main.c"
/* size of stack area used by each thread */
#define STACKSIZE 1024

/* scheduling priority used by each thread */
#define PRIORITY 7
```

Every thread gets its own stack, 1024 bytes here, and a priority, 7. Same values for all three.

<br/>

### Step 3 — Two threads, one function

```c title="zephyr/samples/efz_samples/02_basic/threads/src/main.c"
void blink0(void)
{
	blink(&led0, 100, 0);
}

void blink1(void)
{
	blink(&led1, 1000, 1);
}
```

Two of the threads run the same function, `blink()`. `blink0` flips LED1 every 100 ms, `blink1` flips LED2 every 1000 ms.

The loop inside `blink()`:

```c title="zephyr/samples/efz_samples/02_basic/threads/src/main.c (blink)"
	while (1) {
		gpio_pin_set(spec->port, spec->pin, cnt % 2);

		struct printk_data_t tx_data = { .led = id, .cnt = cnt };

		size_t size = sizeof(struct printk_data_t);
		char *mem_ptr = k_malloc(size);
		__ASSERT_NO_MSG(mem_ptr != 0);

		memcpy(mem_ptr, &tx_data, size);

		k_fifo_put(&printk_fifo, mem_ptr);

		k_msleep(sleep_ms);
		cnt++;
	}
```

It sets the pin, puts a small message (which LED, and its counter) into a FIFO, and sleeps. While it sleeps, the other threads get the CPU.

<br/>

### Step 4 — The third thread prints

```c title="zephyr/samples/efz_samples/02_basic/threads/src/main.c"
void uart_out(void)
{
	while (1) {
		struct printk_data_t *rx_data = k_fifo_get(&printk_fifo,
							   K_FOREVER);
		printk("Toggled led%d; counter=%d\n",
		       rx_data->led, rx_data->cnt);
		k_free(rx_data);
	}
}
```

The blink threads never print. `uart_out` waits on the FIFO (`K_FOREVER`: as long as it takes). Each time a message arrives, it wakes up, prints the line, and frees the memory.

<br/>

### Step 5 — How priorities work

A **lower** priority number means a **more important** thread, and the scheduler always runs the most important thread that's ready. These three spend most of their time asleep or waiting, so they share the CPU without trouble.

<br/>

### Step 6 — Build, flash, and watch

<BoardTabs>
<BoardTab value="efz_esp32s3">

```bash
west build -b efz_esp32s3/esp32s3/procpu zephyr/samples/efz_samples/02_basic/threads -p
west flash
```

</BoardTab>
<BoardTab value="esp32s3_devkitc" unsupported="the sample needs two plain LEDs (the led0 and led1 aliases); the DevKitC's only user LED is the WS2812" />
</BoardTabs>

```text title="Serial console (EFZ)"
Toggled led0; counter=0
Toggled led1; counter=0
Toggled led0; counter=1
Toggled led0; counter=2
...
Toggled led0; counter=9
Toggled led1; counter=1
Toggled led0; counter=10
```

`led0` shows up ten times for every `led1` line. On the board, LED1 flickers fast while LED2 stays on for a second, then off for a second, each at its own pace.

<br/>

---

## Check your work

1. **You should see:** ten `Toggled led0` lines for every `Toggled led1` line, LED1 flickering and LED2 switching once a second.
2. **Change it:** in `blink1()`, change `1000` to `500`, then build and flash again.
3. **It works when:** LED2 switches every half second, and a `led1` line shows up after every fifth `led0` line.

<details>
<summary>Stuck?</summary>

- **`#error "Unsupported board: led0 devicetree alias is not defined"`** → you built for a board without plain LEDs → build for `efz_esp32s3/esp32s3/procpu`.
- **Nothing prints, the LEDs stay dark** → the flash didn't finish or the board didn't reset → press RESET, or run `west flash` again.

</details>

<br/>

---

## What's next

This is the last Basic lesson. The [Intermediate](/docs/zephyr-training/intermediate/) section picks up from here.
