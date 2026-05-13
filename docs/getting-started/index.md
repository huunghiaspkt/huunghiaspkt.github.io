---
title: Introduction
sidebar_label: Introduction
slug: /getting-started
---

# Introduction

Welcome to my documentation site.

I'm **Huu Nghia**, an embedded firmware engineer based in Korea. I specialize in **Zephyr RTOS** firmware development and PCB design with **Altium Designer**. My work sits at the intersection of hardware and software — I design the board, write the firmware, and document the full path from schematic to working product.

This site is my public knowledge base. Everything here is written the way I wish it had existed when I was learning it.

---

## What's in this site

| Section | What you'll find |
|---|---|
| [Zephyr RTOS](/docs/zephyr/devicetree-primer) | Devicetree overlays, driver development, Kconfig patterns — the parts that take the most time to figure out |
| [Hardware](/docs/hardware) | PCB design and Altium workflows — coming soon |
| [Reference](/docs/reference/tools) | Quick-reference tables, tool lists, command cheat sheets |

---

## My setup

| Tool | Version / Notes |
|---|---|
| Zephyr RTOS | v3.7.x (LTS) |
| West | latest stable |
| Altium Designer | 2024 |
| Primary MCU | ESP32 (Espressif Semiconductor) |
| Fabrication | JLCPCB (4-layer, ENIG) |
| IDE | VS Code + nRF Connect extension |
| OS | macOS / Linux |

---

## How to use this site

Each **project page** follows the same structure:

1. **Overview** — what the board does, why I built it, the full stack
2. **Firmware** — devicetree overlay, `prj.conf`, application code with inline explanations
3. **Hardware** — schematic walkthrough organized by functional block, PCB layout notes, BOM
4. **Results** — honest build diary: what worked, what burned, what I'd change on a board spin

The **Zephyr RTOS** section contains standalone guides not tied to a specific project — the kind of reference material I open repeatedly.

---

## Get in touch

- GitHub: [huunghiaspkt](https://github.com/huunghiaspkt)
- If you find an error or want to discuss something, open an issue on the GitHub repo.
