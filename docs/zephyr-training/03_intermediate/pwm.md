---
sidebar_position: 13
description: Drive LEDs, servos, and motors with Zephyr's PWM API — period, pulse width, and devicetree config.
---

# PWM

PWM (pulse-width modulation) outputs a square wave with a configurable period and on-time. The ratio of on-time to period (the **duty cycle**) is what your hardware reads — bright/dim for an LED, position for a servo, speed for a motor.

:::info
Reference: [Zephyr PWM API](https://docs.zephyrproject.org/latest/hardware/peripherals/pwm.html).
:::

<br/>

---

## Enable PWM

```kconfig
CONFIG_PWM=y
```

ESP32-S3 uses the **LEDC** peripheral for PWM. nRF52/53/54 has dedicated `PWM0`..`PWM3` instances. Both expose the same Zephyr API — the difference is hidden behind the binding.

<br/>

---

## Devicetree — declare a PWM consumer

PWM in Zephyr is two layers: a controller node (the hardware peripheral) and a consumer node (your LED, servo, etc.) that references it.

```dts
/ {
    pwmleds {
        compatible = "pwm-leds";
        status_led: pwm_led_0 {
            pwms = <&ledc0 0 PWM_MSEC(20) PWM_POLARITY_NORMAL>;
        };
    };
};
```

The `pwms` cells are: `<controller channel period flags>`. Period is in nanoseconds — the `PWM_MSEC()` / `PWM_USEC()` / `PWM_HZ()` macros do the conversion.

<br/>

---

## C code — set duty cycle

```c
#include <zephyr/drivers/pwm.h>

static const struct pwm_dt_spec status_led =
    PWM_DT_SPEC_GET(DT_NODELABEL(status_led));

int main(void)
{
    if (!pwm_is_ready_dt(&status_led)) {
        return -ENODEV;
    }

    /* 50% duty cycle = half the period on */
    pwm_set_pulse_dt(&status_led, status_led.period / 2);

    return 0;
}
```

To fade the LED:

```c
for (int i = 0; i <= 100; i++) {
    uint32_t pulse = (status_led.period * i) / 100;
    pwm_set_pulse_dt(&status_led, pulse);
    k_msleep(10);
}
```

<br/>

---

## Servo example — pulse width determines angle

Hobby servos expect a 20 ms period with a 1–2 ms pulse:
- 1.0 ms → 0°
- 1.5 ms → 90° (center)
- 2.0 ms → 180°

```c
static const struct pwm_dt_spec servo =
    PWM_DT_SPEC_GET(DT_NODELABEL(servo));

void servo_set_angle(uint8_t degrees)
{
    /* Map 0..180 to 1ms..2ms in nanoseconds */
    uint32_t pulse_ns = PWM_USEC(1000) + (degrees * PWM_USEC(1000)) / 180;
    pwm_set_pulse_dt(&servo, pulse_ns);
}
```

<br/>

---

## Common gotchas

| Symptom | Cause |
|---|---|
| LED is full-on or full-off, never dim | Period too short for the LEDC clock — try `PWM_MSEC(1)` or longer |
| Servo jitters | Period drifted off 20 ms — use `PWM_MSEC(20)` exactly, don't compute from frequency |
| `pwm_set_pulse_dt()` returns `-EINVAL` | Pulse longer than period — clamp it |
| No output on the pin | Pin mux not set up in pinctrl — check the binding |

:::warning
Don't set the period to less than ~1 µs on ESP32 LEDC. The hardware clock divider can't represent very short periods at high resolution, and you'll get aliasing instead of clean PWM.
:::
