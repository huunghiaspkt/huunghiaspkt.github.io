# EmbeddedFun

> Embedded firmware engineering — Zephyr RTOS, PCB design, Industrial IoT, and Edge AI.

[![Site](https://img.shields.io/badge/live-huunghiaspkt.github.io-blue?style=flat-square)](https://huunghiaspkt.github.io)
[![Built with Docusaurus](https://img.shields.io/badge/built%20with-Docusaurus%203-3ECC5F?style=flat-square&logo=docusaurus)](https://docusaurus.io)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)

---

## What's here

| Section | Description |
|---|---|
| **Zephyr RTOS** | Deep-dives, devicetree, drivers, and a step-by-step training series |
| **Protocols** | Embedded communication — UART, SPI, I2C, BLE, MQTT, and more |
| **Industrial IoT** | IIoT patterns, edge connectivity, and real-world deployments |
| **AIoT & Edge AI** | Running ML models on microcontrollers and edge devices |
| **Hardware** | PCB design, schematics, and BOM references |
| **Build Diary** | Lab notes from actual builds — what worked and what didn't |

---

## Local development

**Requires Node.js >= 20**

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:3000
npm start

# Production build
npm run build

# Preview production build locally
npm run serve
```

## Deploy

Hosted on GitHub Pages. Deploys from the `gh-pages` branch.

```bash
npm run deploy
```

---

## Project layout

```
docs/
├── zephyr/              # Zephyr RTOS deep-dives
├── zephyr-training/     # Beginner → advanced training series
├── protocols/           # Communication protocols
├── industrial-iot/      # IIoT use cases and patterns
├── aiot/                # AIoT & edge AI
├── hardware/            # PCB and hardware design
└── reference/           # Tools and quick reference
blog/                    # Build Diary
static/hardware/         # Schematics, BOM, design files
```

## Tech stack

- **[Docusaurus 3](https://docusaurus.io/)** — static site generator
- **TypeScript** — config and React components
- **[docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local)** — offline full-text search
- **GitHub Pages** — hosting
