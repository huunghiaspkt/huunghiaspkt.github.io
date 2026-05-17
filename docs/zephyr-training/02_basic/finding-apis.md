---
sidebar_position: 2
description: How to find the right Zephyr function — quick-reference for the most common peripheral and kernel APIs.
---

# How to Find the API You Need?

Zephyr has 60+ peripheral subsystems and a full kernel services layer. This page is a quick reference for the APIs you'll reach for most often — and a guide to finding anything that isn't listed here.

:::info[Official reference]
Full API docs live at [docs.zephyrproject.org → Hardware → Peripherals](https://docs.zephyrproject.org/latest/hardware/peripherals/index.html) and [Kernel Services](https://docs.zephyrproject.org/latest/kernel/services/index.html). The Doxygen index at `/latest/doxygen/html/index.html` has every function signature.
:::

## The naming pattern

Most Zephyr peripheral functions follow a predictable pattern:

```
<subsystem>_<verb>_dt(&spec, ...)
```

- `gpio_pin_configure_dt` — GPIO subsystem, configure verb, devicetree-spec variant
- `i2c_write_read_dt` — I2C subsystem, write+read verb, DT variant
- `pwm_set_dt` — PWM subsystem, set verb, DT variant

The `_dt` suffix means the function takes a `*_dt_spec` struct populated from devicetree — the preferred pattern for any hardware you describe in a `.overlay`.

---

## Peripherals

### GPIO

```c
#include <zephyr/drivers/gpio.h>
```

```kconfig
CONFIG_GPIO=y
```

| Function | Description |
|---|---|
| `gpio_pin_configure_dt(&spec, flags)` | Set pin direction, pull, active level |
| `gpio_pin_get_dt(&spec)` | Read pin state (returns 0 or 1) |
| `gpio_pin_set_dt(&spec, value)` | Drive pin high or low |
| `gpio_pin_toggle_dt(&spec)` | Flip pin state |
| `gpio_pin_interrupt_configure_dt(&spec, mode)` | Enable edge/level interrupt |
| `gpio_init_callback(&cb, handler, pin_mask)` | Wire up interrupt callback |
| `gpio_add_callback(dev, &cb)` | Register callback with the driver |

See [GPIO](./gpio) for a full working example.

---

### I2C

```c
#include <zephyr/drivers/i2c.h>
```

```kconfig
CONFIG_I2C=y
```

| Function | Description |
|---|---|
| `i2c_write_dt(&spec, buf, len)` | Write bytes to the device |
| `i2c_read_dt(&spec, buf, len)` | Read bytes from the device |
| `i2c_write_read_dt(&spec, wbuf, wlen, rbuf, rlen)` | Write then read in one transaction (register read) |
| `i2c_burst_write_dt(&spec, reg, buf, len)` | Write to a register address + data |

---

### SPI

```c
#include <zephyr/drivers/spi.h>
```

```kconfig
CONFIG_SPI=y
```

| Function | Description |
|---|---|
| `spi_write_dt(&spec, &tx_set)` | Write buffer set |
| `spi_read_dt(&spec, &rx_set)` | Read buffer set |
| `spi_transceive_dt(&spec, &tx_set, &rx_set)` | Full-duplex transfer |

---

### UART

```c
#include <zephyr/drivers/uart.h>
```

```kconfig
CONFIG_SERIAL=y
# For interrupt-driven:
CONFIG_UART_INTERRUPT_DRIVEN=y
# For async/DMA:
CONFIG_UART_ASYNC_API=y
```

| Function | Description |
|---|---|
| `uart_poll_out(dev, c)` | Blocking single-byte write |
| `uart_poll_in(dev, &c)` | Non-blocking single-byte read (returns -1 if no data) |
| `uart_tx(dev, buf, len, timeout)` | Async transmit |
| `uart_rx_enable(dev, buf, len, timeout)` | Async receive |
| `uart_irq_callback_set(dev, cb)` | Set interrupt-driven callback |

:::tip
For debug output, use `printk()` or the [logging subsystem](#logging) instead of raw UART calls.
:::

---

### PWM

```c
#include <zephyr/drivers/pwm.h>
```

```kconfig
CONFIG_PWM=y
```

| Function | Description |
|---|---|
| `pwm_set_dt(&spec, period, pulse)` | Set period and pulse width (nanoseconds) |
| `pwm_set_cycles(&spec, period, pulse, flags)` | Set in hardware clock cycles |

---

### ADC

```c
#include <zephyr/drivers/adc.h>
```

```kconfig
CONFIG_ADC=y
```

| Function | Description |
|---|---|
| `adc_channel_setup_dt(&spec)` | Configure a channel from devicetree |
| `adc_sequence_init_dt(&spec, &seq)` | Initialize a read sequence |
| `adc_read(dev, &seq)` | Blocking ADC read |
| `adc_read_async(dev, &seq, signal)` | Non-blocking ADC read |

---

### Sensors

```c
#include <zephyr/drivers/sensor.h>
```

```kconfig
CONFIG_SENSOR=y
CONFIG_<DRIVER_NAME>=y   # e.g. CONFIG_SHT3XD=y
```

| Function | Description |
|---|---|
| `sensor_sample_fetch(dev)` | Trigger measurement, block until done |
| `sensor_sample_fetch_chan(dev, chan)` | Fetch a specific channel only |
| `sensor_channel_get(dev, chan, &val)` | Read the fetched value into `sensor_value` |
| `sensor_trigger_set(dev, &trig, handler)` | Register a callback for data-ready / threshold events |

`sensor_value` has two fields: `val1` (integer) and `val2` (millionths). Convert to float: `val1 + val2 / 1e6`.

---

## Kernel services

All kernel functions use a single header:

```c
#include <zephyr/kernel.h>
```

### Threads

| Function / Macro | Description |
|---|---|
| `K_THREAD_DEFINE(name, stack, fn, p1, p2, p3, prio, opts, delay)` | Static thread definition (preferred) |
| `k_thread_create(&t, stack, size, fn, p1, p2, p3, prio, opts, delay)` | Dynamic thread creation |
| `k_sleep(K_MSEC(n))` | Sleep for n milliseconds |
| `k_sleep(K_FOREVER)` | Block indefinitely (yield to scheduler) |
| `k_yield()` | Yield to same-priority threads |
| `k_thread_suspend(t)` / `k_thread_resume(t)` | Pause and unpause a thread |

---

### Timers

| Function | Description |
|---|---|
| `k_timer_init(&t, expiry_fn, stop_fn)` | Initialize a timer with callbacks |
| `k_timer_start(&t, duration, period)` | Start one-shot or periodic timer |
| `k_timer_stop(&t)` | Stop a running timer |
| `k_timer_status_get(&t)` | How many times has it fired since last check |
| `k_timer_remaining_get(&t)` | Milliseconds until next expiry |

Durations use `K_MSEC()`, `K_USEC()`, `K_SECONDS()`, or `K_NO_WAIT`.

---

### Semaphores

| Function | Description |
|---|---|
| `k_sem_init(&sem, initial, limit)` | Initialize (static allocation) |
| `k_sem_take(&sem, timeout)` | Acquire — blocks if count is 0 |
| `k_sem_give(&sem)` | Release — safe to call from ISR |
| `k_sem_count_get(&sem)` | Read current count |
| `K_SEM_DEFINE(name, initial, limit)` | Static definition at module scope |

---

### Mutexes

| Function | Description |
|---|---|
| `k_mutex_init(&m)` | Initialize |
| `k_mutex_lock(&m, timeout)` | Acquire (supports priority inheritance) |
| `k_mutex_unlock(&m)` | Release |
| `K_MUTEX_DEFINE(name)` | Static definition |

:::warning
Never call `k_mutex_lock` from an ISR. Use a semaphore instead.
:::

---

### Work queues

Work queues let you defer work from an ISR to a thread context — the standard pattern for "do real work after an interrupt."

| Function / Macro | Description |
|---|---|
| `K_WORK_DEFINE(name, handler)` | Static work item |
| `k_work_init(&w, handler)` | Dynamic work item |
| `k_work_submit(&w)` | Enqueue on the system workqueue |
| `K_WORK_DELAYABLE_DEFINE(name, handler)` | Work that fires after a delay |
| `k_work_schedule(&dw, delay)` | Schedule delayed work |

---

### Message queues

| Function | Description |
|---|---|
| `K_MSGQ_DEFINE(name, msg_size, max_msgs, align)` | Static message queue |
| `k_msgq_put(&q, &data, timeout)` | Enqueue a message (ISR-safe) |
| `k_msgq_get(&q, &data, timeout)` | Dequeue a message |
| `k_msgq_num_used_get(&q)` | How many messages are waiting |

---

## Logging

```c
#include <zephyr/logging/log.h>
```

```kconfig
CONFIG_LOG=y
CONFIG_LOG_DEFAULT_LEVEL=3   # 0=off 1=err 2=warn 3=info 4=debug
```

```c
LOG_MODULE_REGISTER(my_module, LOG_LEVEL_DBG);

LOG_ERR("Fatal: %d", err);
LOG_WRN("Retrying...");
LOG_INF("Temperature: %d.%06d", val.val1, val.val2);
LOG_DBG("raw = 0x%04x", raw);
```

Each module registers independently with `LOG_MODULE_REGISTER`. You can filter per module at runtime.

---

## Where to go next

| Need | Where to look |
|---|---|
| Full function signatures | [Zephyr Doxygen](https://docs.zephyrproject.org/latest/doxygen/html/index.html) |
| Working examples | `zephyr/samples/` in your Zephyr installation |
| All Kconfig symbols | `west build -t menuconfig` or the [Kconfig reference](https://docs.zephyrproject.org/latest/kconfig.html) |
| 60+ peripheral subsystems | [Hardware → Peripherals index](https://docs.zephyrproject.org/latest/hardware/peripherals/index.html) |
