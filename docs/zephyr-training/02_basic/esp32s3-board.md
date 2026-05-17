---
sidebar_position: 3
description: Quick introduction to the ESP32-S3-DevKitC.
---

# Meet the ESP32-S3-DevKitC

As an embedded developer, you have probably heard of the ESP32 at least once. It is affordable, capable, and easy to get. The S3 variant adds a faster dual-core CPU, native USB, and more GPIO — making it a solid choice for learning without spending much.

It also has Wi-Fi and BLE built in, which means the wireless examples later in this training need no extra hardware.

We use it here because it is practical — not because it is special. The Zephyr concepts you learn on this board apply identically on nRF52, STM32, or any other supported chip.

<br/>

---

## The board

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img
    src="https://docs.zephyrproject.org/latest/_images/esp32s3_devkitc.webp"
    alt="ESP32-S3-DevKitC development board"
    style={{maxWidth: '600px', width: '100%', borderRadius: '8px'}}
  />
  <p style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
    ESP32-S3-DevKitC — entry-level development board by Espressif
  </p>
</div>

:::info[Official reference]
[docs.zephyrproject.org — ESP32-S3-DevKitC](https://docs.zephyrproject.org/latest/boards/espressif/esp32s3_devkitc/doc/index.html)
:::

<br/>

---

## Key specs

| Feature | Detail |
|---|---|
| **CPU** | Dual-core Xtensa LX7, up to 240 MHz |
| **RAM** | 512 KB SRAM |
| **Wireless** | Wi-Fi 802.11 b/g/n + Bluetooth LE 5.0 |
| **GPIO** | 45 programmable GPIOs |
| **Interfaces** | 3× UART, 2× I2C, 2× I2S, 4× SPI |
| **USB** | USB Serial/JTAG + Full-speed USB OTG |
| **RGB LED** | 1× addressable WS2812 (GPIO48, via I2S) |
| **Touch** | 14 capacitive touch-sensing I/O pins |

<br/>

---

## West board target

In Zephyr, this board is identified as:

```bash
west build -b esp32s3_devkitc/esp32s3/procpu .
```

The qualifier `/esp32s3/procpu` selects the main application CPU (procpu). All examples in this training use this target.

:::tip[How to find the right target for any board]
On every Zephyr board page, scroll to the **Supported Features** section. At the bottom you will see a board target selector:

<img src="/img/zephyr-board-target-selector.png" alt="Zephyr board target selector with dropdown and copy button" style={{maxWidth: '560px', width: '100%', borderRadius: '6px', margin: '0.75rem 0'}} />

Use the **dropdown** to switch between available CPU targets, then hit the **copy button** to get the exact string for your `west build -b` command. No guessing, no typos.

👉 [ESP32-S3-DevKitC — Supported Features](https://docs.zephyrproject.org/latest/boards/espressif/esp32s3_devkitc/doc/index.html#supported-features)
:::
