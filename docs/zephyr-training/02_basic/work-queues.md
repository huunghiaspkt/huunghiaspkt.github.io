---
sidebar_position: 7
title: "Work Queues"
description: "Hand short jobs to Zephyr's system work queue: handle a button press outside the interrupt, blink an LED with no thread of your own, and move a slow job to its own queue."
outcomes: [LO4]
module: W4
verified: "fork main · efz_samples/02_basic/work_blink, work_button, work_own_queue · board efz_esp32s3 rev 1 · 2026-10-27"
---

# Work Queues

In the [Threads](/docs/zephyr-training/basic/threads) lesson, every job got its own thread: its own loop, its own stack, and a `k_msleep()` to wait. That works, but it isn't always the right tool.

Some jobs are short. Toggle an LED, react to a button, send one message. Giving each one a whole thread costs a stack every time (1024 bytes each in the threads sample). And some jobs start in an **interrupt handler**, which must finish fast: it can't sleep, wait, or print a lot.

Zephyr's answer is the **work queue**. In this lesson you use it three ways, on the EFZ's LEDs and buttons.

## By the end of this lesson you can

- Say what a work item and a work queue are, and when to use one instead of a thread.
- Hand a button press from its interrupt handler to a work item.
- Blink an LED with a delayable work item, with no thread and no sleep of your own.
- Move a slow job off the system work queue onto a queue of your own.

<LessonMeta time="about 40 minutes" need="the EFZ and its USB cable" before="Threads" beforeHref="/docs/zephyr-training/basic/threads" />

<br/>

---

## What a work queue is

A **work item** is a job: your function (the **handler**) plus a small `struct k_work` that remembers the handler and whether the job is waiting or running. You **submit** it, and some time later a thread calls your function once.

A **work queue** is that thread. It takes work items one at a time, in the order they came in, runs each one to the end, and sleeps when there's nothing to do.

Zephyr already has one running for you, the **system work queue**. Its thread is called `sysworkq`. By default it has a 1024-byte stack and priority −1, which is a cooperative priority: higher than the priority-7 threads from the last lesson, and once a job starts, other threads can't interrupt it. Zephyr starts this thread at boot, before `main()`, even if your app never creates a thread of its own. It sleeps until you submit a work item. Your work items borrow that thread and its stack, so they don't need a stack of their own.

There are two kinds of work items:

| Kind | Define it with | Runs |
|---|---|---|
| Work item | `K_WORK_DEFINE(name, handler)` | as soon as the queue gets to it, after `k_work_submit()` |
| Delayable work item | `K_WORK_DELAYABLE_DEFINE(name, handler)` | after a delay you pick, with `k_work_schedule()` or `k_work_reschedule()` |

A delayable work item is a normal work item with a timer attached. `k_work_schedule()` starts the timer. Until it runs out, the item isn't in any queue. Then it's submitted like any other work item, and the queue's thread runs it.

### Where a work item goes

Submitting puts the work item at the end of a queue's list. Which queue depends on the call:

| Call | The work item goes into |
|---|---|
| `k_work_submit(&work)` | the system work queue |
| `k_work_submit_to_queue(&my_queue, &work)` | the queue you name |
| `k_work_schedule(&dwork, delay)` | the system work queue, once the delay is up |
| `k_work_schedule_for_queue(&my_queue, &dwork, delay)` | the queue you name, once the delay is up |

```text
k_work_submit(&job_c)
        │
        ▼
 queue:  job_a → job_b → job_c        (waiting, in order)
        │
        ▼
 the queue's thread: job_a's handler, then job_b's, then job_c's
```

The queue's thread wakes up, takes the first item, calls its handler, and when the handler returns, takes the next one. So your handler runs **in that thread**, with its stack and its priority. A delayable item waits on a timer first; when the timer runs out, it goes into the queue the same way.

A work item is in a queue at most once. Submit it while it's already waiting, and nothing happens: it still runs once. Submit it while its handler is running, and it goes back in the queue, to run once more after that. Demo 1 shows both.

Demos 1 and 2 use the system work queue. Demo 3 makes a queue of its own.

If you know FreeRTOS: a work item on the system work queue is like `xTimerPendFunctionCallFromISR()`, which hands a function to FreeRTOS's shared timer task.

<br/>

---

## Demo 1 — A button press, handled outside the interrupt

**Code:** [`zephyr/samples/efz_samples/02_basic/work_button`](https://github.com/huunghiaspkt/zephyr/tree/main/samples/efz_samples/02_basic/work_button)

This is the job work queues were made for. A button interrupt has to be quick, so it doesn't do the work itself. It submits a work item and returns, and the work queue does the rest in a normal thread.

<br/>

### Step 1 — The interrupt hands off

```c title="zephyr/samples/efz_samples/02_basic/work_button/src/main.c"
static void button_handler(struct k_work *work)
{
	runs++;
	gpio_pin_toggle_dt(&led);
	printk("LED2 toggled: %d interrupts, %d runs\n", interrupts, runs);
	k_msleep(JOB_MS);
}

static K_WORK_DEFINE(button_work, button_handler);

static void button_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
	interrupts++;
	k_work_submit(&button_work);
}
```

`K_WORK_DEFINE` makes a work item called `button_work` and ties it to `button_handler()`. Every work handler takes one argument, the work item that's running.

`button_pressed()` is the interrupt callback for BN1. It counts the interrupt and calls `k_work_submit()`, which is safe to call from an interrupt. That's all it does.

`button_handler()` runs later, in the `sysworkq` thread. It toggles LED2 and prints both counters. Then it sleeps for 1 second (`JOB_MS`), so it acts like a job that takes a while. `main()` sets up BN1 the way you did in [Buttons & LEDs](/docs/zephyr-training/basic/buttons-leds): input, an interrupt on the press edge, and a callback.

<br/>

### Step 2 — Press it, and count

<BoardTabs>
<BoardTab value="efz_esp32s3">

```bash
west build -b efz_esp32s3/esp32s3/procpu zephyr/samples/efz_samples/02_basic/work_button -p
west flash
west espressif monitor
```

Press `Ctrl+]` to quit the monitor.

</BoardTab>
<BoardTab value="esp32s3_devkitc" unsupported="the samples in this lesson need plain LEDs and the BN1/BN2 buttons; the DevKitC's only user LED is the WS2812" />
</BoardTabs>

Press BN1 a few times slowly, more than a second apart. Then press it fast, many times.

```text title="Serial console (EFZ), example"
Press BN1
LED2 toggled: 1 interrupts, 1 runs
LED2 toggled: 2 interrupts, 2 runs
LED2 toggled: 3 interrupts, 3 runs
LED2 toggled: 11 interrupts, 4 runs
LED2 toggled: 20 interrupts, 5 runs
```

Slow presses give one run each. Fast presses don't: `interrupts` races ahead of `runs`. While the handler sleeps, the first new press puts the work item back in the queue. Every press after that finds the item **already waiting**, and submitting a waiting item does nothing, so those submits **merge** into one run. Ten submits don't mean ten runs. Exercise 3 uses this to debounce the button.

<br/>

---

## Demo 2 — Blink with a delayable work item

**Code:** [`zephyr/samples/efz_samples/02_basic/work_blink`](https://github.com/huunghiaspkt/zephyr/tree/main/samples/efz_samples/02_basic/work_blink)

Demo 1's work item ran as soon as it was submitted. To blink, a job has to run again and again, half a second apart. That's what a delayable work item is for.

<br/>

### Step 3 — The job

```c title="zephyr/samples/efz_samples/02_basic/work_blink/src/main.c"
static void blink_handler(struct k_work *work);
static K_WORK_DELAYABLE_DEFINE(blink_work, blink_handler);

static void blink_handler(struct k_work *work)
{
	gpio_pin_toggle_dt(&led);
	printk("LED1 toggled\n");
	k_work_schedule(&blink_work, K_MSEC(BLINK_MS));
}
```

`K_WORK_DELAYABLE_DEFINE` makes a delayable work item called `blink_work` and ties it to `blink_handler()`. The first line declares the handler, so the macro can use it before its body appears.

The handler is the whole job. It toggles LED1, prints a line, and asks to run again in 500 ms (`BLINK_MS`). Then it returns. There's no `while (1)` and no `k_msleep()`: the waiting happens in the work queue, not in your code.

<br/>

### Step 4 — Start it

```c title="zephyr/samples/efz_samples/02_basic/work_blink/src/main.c"
int main(void)
{
	if (!gpio_is_ready_dt(&led)) {
		return 0;
	}
	gpio_pin_configure_dt(&led, GPIO_OUTPUT_INACTIVE);

	k_work_schedule(&blink_work, K_NO_WAIT);
	return 0;
}
```

`main()` sets up LED1, then schedules the first run with `K_NO_WAIT`: run as soon as possible. `main()` returns, and the blinking keeps going because each run schedules the next one.

<br/>

### Step 5 — Build, flash, and watch

```bash
west build -b efz_esp32s3/esp32s3/procpu zephyr/samples/efz_samples/02_basic/work_blink -p
west flash
west espressif monitor
```

```text title="Serial console (EFZ)"
LED1 toggled
LED1 toggled
LED1 toggled
```

LED1 changes every half second, and a `LED1 toggled` line shows up each time.

<br/>

---

## Demo 3 — When not to use the system work queue

**Code:** [`zephyr/samples/efz_samples/02_basic/work_own_queue`](https://github.com/huunghiaspkt/zephyr/tree/main/samples/efz_samples/02_basic/work_own_queue)

This last demo is a small challenge: it uses the system work queue, and it also creates a work queue of its own, with its own thread. Every work item on the system work queue shares one thread. If one job takes long, every other job waits behind it.

<br/>

### Step 6 — A slow job on the system queue

```c title="zephyr/samples/efz_samples/02_basic/work_own_queue/src/main.c"
static void slow_handler(struct k_work *work)
{
	const char *queue = k_thread_name_get(k_current_get());

	printk("slow job starts on %s\n", queue);
	k_busy_wait(SLOW_MS * 1000);
	printk("slow job done on %s\n", queue);
}

static K_WORK_DEFINE(slow_on_system, slow_handler);
static K_WORK_DEFINE(slow_on_mine, slow_handler);
```

LED1 blinks every 250 ms from a delayable work item, like Demo 2. `slow_handler()` keeps the CPU busy for 2 seconds with `k_busy_wait()` and prints which queue it ran on.

BN1 submits `slow_on_system` to the system work queue. While it runs, the blink job can't: they share `sysworkq`. **LED1 freezes for 2 seconds.**

<br/>

### Step 7 — Give the slow job its own queue

```c title="zephyr/samples/efz_samples/02_basic/work_own_queue/src/main.c"
K_THREAD_STACK_DEFINE(my_stack, MY_STACK_SIZE);
static struct k_work_q my_queue;
```

```c title="zephyr/samples/efz_samples/02_basic/work_own_queue/src/main.c (in main)"
	struct k_work_queue_config cfg = { .name = "my_queue" };

	k_work_queue_init(&my_queue);
	k_work_queue_start(&my_queue, my_stack, K_THREAD_STACK_SIZEOF(my_stack), MY_PRIORITY, &cfg);
```

```c title="zephyr/samples/efz_samples/02_basic/work_own_queue/src/main.c"
static void bn2_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
	k_work_submit_to_queue(&my_queue, &slow_on_mine);
}
```

A queue of your own is a thread. Like the threads you created with `K_THREAD_DEFINE` in [Threads](/docs/zephyr-training/basic/threads), it needs a stack (1024 bytes) and a priority; `k_work_queue_start()` creates the thread for you. `MY_PRIORITY` is 10, lower than the system work queue. BN2 submits the same slow job to `my_queue` with `k_work_submit_to_queue()`.

Now when the blink is due, the system work queue's thread is free and more important, so it runs between the busy moments. **LED1 keeps blinking.**

<br/>

### Step 8 — Try both buttons

```bash
west build -b efz_esp32s3/esp32s3/procpu zephyr/samples/efz_samples/02_basic/work_own_queue -p
west flash
west espressif monitor
```

```text title="Serial console (EFZ)"
BN1: slow job on the system queue. BN2: slow job on my_queue.
slow job starts on sysworkq
slow job done on sysworkq
slow job starts on my_queue
slow job done on my_queue
```

Press BN1: LED1 stops for 2 seconds. Press BN2: LED1 keeps blinking while the slow job runs.

<br/>

---

## Thread or work item?

| Use a work item when… | Use a thread when… |
|---|---|
| the job is short: it runs, then returns | the job is a loop that runs forever |
| an interrupt or a timer triggers it | it needs its own priority |
| you'd rather not spend a stack on it | it waits or blocks for a long time |

And when the job is slow but still a one-off, use a **work queue of your own**, like Demo 3.

A few things that catch people out:

- **The system work queue isn't low priority.** Its priority is −1, so its jobs run before your priority-7 threads.
- **Don't block in a handler.** A handler may wait, but nothing else on that queue runs until it returns.
- **`k_work_schedule()` keeps the first deadline; `k_work_reschedule()` restarts it.** If an item is already scheduled, `schedule` does nothing and `reschedule` moves the deadline later.
- **Older tutorials say `k_delayed_work`.** Zephyr renamed it `k_work_delayable` in version 2.6 and removed the old name in 3.2.

<br/>

---

## Your turn

### Exercise 1 — Blink LED2 too

Start from `work_blink`. Add a second delayable work item that toggles LED2 every 1000 ms, so both LEDs blink at their own speed.

<details>
<summary>Show our solution</summary>

```c title="work_blink/src/main.c (what's new)"
static const struct gpio_dt_spec led2 = GPIO_DT_SPEC_GET(DT_ALIAS(led1), gpios);

static void blink2_handler(struct k_work *work);
static K_WORK_DELAYABLE_DEFINE(blink2_work, blink2_handler);

static void blink2_handler(struct k_work *work)
{
	gpio_pin_toggle_dt(&led2);
	k_work_schedule(&blink2_work, K_MSEC(1000));
}

int main(void)
{
	if (!gpio_is_ready_dt(&led) || !gpio_is_ready_dt(&led2)) {
		return 0;
	}
	gpio_pin_configure_dt(&led, GPIO_OUTPUT_INACTIVE);
	gpio_pin_configure_dt(&led2, GPIO_OUTPUT_INACTIVE);

	k_work_schedule(&blink_work, K_NO_WAIT);
	k_work_schedule(&blink2_work, K_NO_WAIT);
	return 0;
}
```

Two LEDs, two work items, and still no thread of your own: both handlers take turns on `sysworkq`.

</details>

### Exercise 2 — Stop and start with BN2

Still in `work_blink`: make BN2 stop the blinking, and start it again on the next press. Use `k_work_cancel_delayable()` to stop it and `k_work_schedule()` to start it.

<details>
<summary>Show our solution</summary>

```c title="work_blink/src/main.c (what's new)"
static const struct gpio_dt_spec bn2 = GPIO_DT_SPEC_GET(DT_ALIAS(sw1), gpios);
static struct gpio_callback bn2_cb;
static bool blinking = true;

static void bn2_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
	blinking = !blinking;
	if (blinking) {
		k_work_schedule(&blink_work, K_NO_WAIT);
	} else {
		k_work_cancel_delayable(&blink_work);
	}
}
```

```c title="work_blink/src/main.c (in main, after LED1 is set up)"
	gpio_pin_configure_dt(&bn2, GPIO_INPUT);
	gpio_pin_interrupt_configure_dt(&bn2, GPIO_INT_EDGE_TO_ACTIVE);
	gpio_init_callback(&bn2_cb, bn2_pressed, BIT(bn2.pin));
	gpio_add_callback(bn2.port, &bn2_cb);
```

Both calls are safe from an interrupt. If BN2 bounces, one press can toggle `blinking` twice; Exercise 3 shows the fix.

</details>

### Exercise 3 — Debounce BN1

Start from `work_button`, and take out the `k_msleep()`. Make one press give exactly one run, however much the button bounces. Hint: use a delayable work item, restart a 30 ms delay on every interrupt with `k_work_reschedule()`, and in the handler check that the button is still pressed.

<details>
<summary>Show our solution</summary>

```c title="work_button/src/main.c (what changed)"
static void button_handler(struct k_work *work)
{
	if (gpio_pin_get_dt(&button) != 1) {
		return;
	}
	runs++;
	gpio_pin_toggle_dt(&led);
	printk("LED2 toggled: %d interrupts, %d runs\n", interrupts, runs);
}

static K_WORK_DELAYABLE_DEFINE(button_work, button_handler);

static void button_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
	interrupts++;
	k_work_reschedule(&button_work, K_MSEC(30));
}
```

Every bounce restarts the 30 ms timer, so the handler runs once, 30 ms after the last bounce, when the button has settled. `interrupts` can still grow by more than one per press, but `runs` grows by exactly one. This is why debounce needs `reschedule`: `k_work_schedule()` would keep the first deadline and could read the pin while it's still bouncing.

</details>

<br/>

---

## Check your work

1. **You should see:** in Demo 2, LED1 toggling every half second; in Demo 3, LED1 freezing on BN1 and not on BN2.
2. **Change it:** in `work_blink`, change `BLINK_MS` to `100`, then build and flash again.
3. **It works when:** LED1 blinks five times as fast, with five `LED1 toggled` lines per half second.

<details>
<summary>Stuck?</summary>

- **A build error mentioning `led0`, `led1`, `sw0` or `sw1`** → you built for a board without plain LEDs and buttons → build for `efz_esp32s3/esp32s3/procpu`.
- **`'blink_handler' undeclared`** → the handler isn't declared before `K_WORK_DELAYABLE_DEFINE` → keep the line `static void blink_handler(struct k_work *work);` above it.
- **The LED blinks once and stops** → the handler doesn't call `k_work_schedule()` again → a delayable work item runs once per schedule.
- **Nothing happens on BN1 or BN2** → the interrupt or the callback isn't set up → check `gpio_pin_interrupt_configure_dt()` and `gpio_add_callback()` in `main()`.

</details>

<br/>

---

## What's next

This is the last Basic lesson so far. The [Intermediate](/docs/zephyr-training/intermediate/) section picks up from here.
