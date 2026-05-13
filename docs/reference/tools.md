---
title: Tools
sidebar_label: Tools & Environment
---

# Tools & Development Environment

The tools I use for every project, with setup notes.

---

## Firmware development

| Tool | Purpose | Notes |
|---|---|---|
| **Zephyr RTOS** | RTOS + HAL + drivers | Use `west` to manage the workspace |
| **West** | Zephyr's meta-tool | Handles dependency management, building, flashing |
| **VS Code** | Editor | With nRF Connect for VS Code extension |
| **nRF Connect for VS Code** | Zephyr build GUI | Optional but useful for beginners |
| **J-Link** | Debug probe | Segger J-Link EDU Mini (~$20) or J-Link BASE |
| **nRF Connect for Desktop** | BLE testing | Connect, read GATT, log data |
| **Ozone** | Graphical debugger | Segger's IDE, works with J-Link |

---

## Hardware design

| Tool | Purpose | Notes |
|---|---|---|
| **Altium Designer** | Schematic + PCB | Primary design tool |
| **KiCad** | Open-source alternative | Useful for sharing open hardware designs |
| **JLCPCB** | PCB fabrication | 4-layer, ENIG, $12 shipped for 5 boards |
| **Mouser / Digi-Key** | Component sourcing | Always check lead time before ordering |
| **LCSC** | Component sourcing (cheap) | Good for passives and basic ICs, faster from Korea |

---

## Measurement & debug

| Tool | Purpose | Notes |
|---|---|---|
| **Rigol DS1054Z** | Oscilloscope | 50 MHz, 4-channel, cheap and reliable |
| **Espressif PPK2** | Power profiler | Current measurement down to nA for power budget |
| **Hot air station** | Rework | QFN soldering and component removal |
| **Microscope** | Inspection | USB microscope for solder joint inspection |

---

## Environment setup (macOS)

```bash
# Install west
pip3 install west

# Initialize Zephyr workspace
west init -m https://github.com/zephyrproject-rtos/zephyr \
  --mr v3.7.0 ~/zephyrproject
cd ~/zephyrproject
west update

# Install Python dependencies
pip3 install -r zephyr/scripts/requirements.txt

# Install the Zephyr SDK
# Download from https://github.com/zephyrproject-rtos/sdk-ng/releases
# Run the installer: ./zephyr-sdk-0.16.x-setup.sh

# Verify
west boards | grep esp32
```
