---
sidebar_position: 5
description: Read buttons and blink LEDs with Zephyr's GPIO API — the hardware "Hello World".
---

# GPIO

GPIO is the most fundamental peripheral. Blinking an LED and reading a button are the hardware equivalent of Hello World — and Zephyr's GPIO API is clean enough that it teaches the whole driver model pattern at the same time.

## Devicetree setup

On the ESP32 DK, LEDs and buttons are already defined in the board DTS. Reference them by alias:

```c
/* Already in esp32_devkitc_wroom.dts — no overlay needed */
/ {
    aliases {
        led0 = &led0;
        sw0  = &button0;
    };
};
```

## Blinking an LED

```c title="src/main.c"
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>

/* Get the LED spec from the DTS alias */
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(DT_ALIAS(led0), gpios);

int main(void)
{
    if (!gpio_is_ready_dt(&led)) {
        return -ENODEV;
    }

    gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);

    while (1) {
        gpio_pin_toggle_dt(&led);
        k_sleep(K_MSEC(500));
    }
}
```

**Key points:**
- `GPIO_DT_SPEC_GET` resolves the pin and flags from the DTS at compile time — no `#define PIN 13` needed
- `GPIO_OUTPUT_ACTIVE` drives the pin to its active state (respects `GPIO_ACTIVE_LOW` defined in the DTS)
- `gpio_pin_toggle_dt` flips the current state

## Reading a button (polling)

```c
static const struct gpio_dt_spec btn = GPIO_DT_SPEC_GET(DT_ALIAS(sw0), gpios);

int main(void)
{
    gpio_pin_configure_dt(&btn, GPIO_INPUT);

    while (1) {
        int val = gpio_pin_get_dt(&btn);
        if (val == 1) {
            printk("Button pressed\n");
        }
        k_sleep(K_MSEC(10));
    }
}
```

## Button with interrupt (event-driven)

Polling burns CPU. Use an interrupt callback instead:

```c
#include <zephyr/drivers/gpio.h>

static struct gpio_callback btn_cb_data;

void button_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
    printk("Button pressed at %" PRIu32 "\n", k_cycle_get_32());
}

int main(void)
{
    static const struct gpio_dt_spec btn = GPIO_DT_SPEC_GET(DT_ALIAS(sw0), gpios);

    gpio_pin_configure_dt(&btn, GPIO_INPUT);
    gpio_pin_interrupt_configure_dt(&btn, GPIO_INT_EDGE_TO_ACTIVE);

    gpio_init_callback(&btn_cb_data, button_pressed, BIT(btn.pin));
    gpio_add_callback(btn.port, &btn_cb_data);

    /* Main loop does other work */
    while (1) {
        k_sleep(K_FOREVER);
    }
}
```

## Kconfig requirements

```kconfig title="prj.conf"
CONFIG_GPIO=y
```

That's it. GPIO is enabled by default on most boards, but explicit is better.

:::warning
GPIO interrupts run in interrupt context — keep the callback fast. No `k_sleep`, no logging with `%s`, no dynamic memory. Use a semaphore or work queue to hand off to a thread for any real work.
:::
