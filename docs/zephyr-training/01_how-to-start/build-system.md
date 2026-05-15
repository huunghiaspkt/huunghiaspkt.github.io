---
sidebar_position: 5
description: How Zephyr's CMake + Ninja build system works, and common build flags you'll use every day.
---

# The Build System

Zephyr uses **CMake** as its build system generator and **Ninja** as the build tool. You almost never write CMake directly — West handles it for you.

<br/>

---

## Build output files

After `west build`, everything lands in the `build/zephyr/` directory:

| File | What it's for |
|---|---|
| `zephyr.elf` | ELF binary with debug symbols — used by GDB |
| `zephyr.hex` | Intel HEX format for flashing |
| `zephyr.bin` | Raw binary |
| `zephyr.dts` | Merged, final devicetree — read this to debug DT issues |
| `.config` | Final resolved Kconfig — read this to debug config issues |
| `zephyr.map` | Linker map — shows flash and RAM usage per symbol |

<br/>

---

## Checking memory usage

After a build, check how much flash and RAM your firmware uses:

```bash
west build -b esp32_devkitc_wroom . && \
  cat build/zephyr/zephyr.stat
```

Or with the size tool:

```bash
arm-zephyr-eabi-size build/zephyr/zephyr.elf
```

Example output:

```
   text    data     bss     dec     hex filename
  42312     312    6248   48872    bf08 build/zephyr/zephyr.elf
```

| Field | Meaning |
|---|---|
| `text` | Flash used by code and read-only data |
| `data` | RAM used by initialized variables (also stored in flash) |
| `bss` | RAM used by zero-initialized variables |

<br/>

---

## Useful build flags

```bash
# Force a full clean rebuild
west build --pristine

# Build with a custom overlay file
west build -b esp32_devkitc_wroom . -- \
  -DDTC_OVERLAY_FILE=boards/esp32_devkitc_wroom.overlay

# Override a Kconfig value without editing prj.conf
west build -b esp32_devkitc_wroom . -- \
  -DCONFIG_LOG_DEFAULT_LEVEL=4

# Build with verbose output (see every compiler command)
west build -b esp32_devkitc_wroom . -- -DCMAKE_VERBOSE_MAKEFILE=ON
```

:::note
`--` separates `west build` arguments from CMake arguments. Everything after `--` is passed directly to CMake.
:::

<br/>

---

## Build-time vs. runtime errors

| Error type | When it happens | How to debug |
|---|---|---|
| **Kconfig error** | `west build` fails | Check the `depends on` chain in the driver's `Kconfig` file |
| **DTS error** | `west build` fails | Read `build/zephyr/zephyr.dts` after fixing |
| **Linker error** | `west build` fails | Usually a missing `CONFIG_` or wrong `target_sources()` |
| **Runtime panic** | Board crashes after flash | Use Serial Monitor or `west debug` + GDB |

:::tip[Build failing with a cryptic error?]
The first thing to check is always `build/zephyr/.config` (Kconfig) and `build/zephyr/zephyr.dts` (devicetree). The build system writes these intermediate files before compilation — they show exactly what Zephyr assembled from your project.
:::

<br/>

---

## 🎉 You're ready!

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img src="/img/zephyr-logo-light.svg" alt="Zephyr RTOS" style={{width: '200px', marginBottom: '1rem'}} />
  <h3 style={{fontWeight: 700, fontSize: '1.5rem'}}>Welcome to Zephyr RTOS 🚀</h3>
  <p style={{fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)'}}>
    You've just completed the full embedded development loop.<br/>
    From zero to firmware running on real hardware — that's no small thing.
  </p>
</div>

**Here's what you accomplished:**

✅ Set up a cross-platform Zephyr development environment  
✅ Installed west and initialized a workspace with Zephyr v4.4.0  
✅ Built and flashed your first firmware binary  
✅ Read live output from your board over serial  

<br/>

**What's next — the real Zephyr:**

<div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.5rem 0'}}>

<div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', padding: '1.25rem'}}>
  <div style={{fontSize: '2rem'}}>🌳</div>
  <strong>Devicetree</strong>
  <p style={{fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--ifm-color-emphasis-700)'}}>Describe your hardware in code. The heart of Zephyr.</p>
</div>

<div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', padding: '1.25rem'}}>
  <div style={{fontSize: '2rem'}}>⚙️</div>
  <strong>Kconfig</strong>
  <p style={{fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--ifm-color-emphasis-700)'}}>Control exactly what gets compiled into your firmware.</p>
</div>

<div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', padding: '1.25rem'}}>
  <div style={{fontSize: '2rem'}}>🔌</div>
  <strong>Drivers & Peripherals</strong>
  <p style={{fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--ifm-color-emphasis-700)'}}>GPIO, I2C, SPI, UART, BLE — all with one unified API.</p>
</div>

<div style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', padding: '1.25rem'}}>
  <div style={{fontSize: '2rem'}}>🧵</div>
  <strong>Threads & RTOS</strong>
  <p style={{fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--ifm-color-emphasis-700)'}}>Semaphores, message queues, timers — real-time done right.</p>
</div>

</div>

> Every embedded engineer who works with Zephyr started exactly where you are right now. The tools are set up, the workspace is ready — **now go build something real.** 💪

