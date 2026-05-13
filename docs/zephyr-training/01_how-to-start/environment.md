---
sidebar_position: 2
description: Install west, the Zephyr SDK, and set up VS Code for embedded development.
---

# Environment Setup

Three things to install: **west** (the workspace tool), the **Zephyr SDK** (toolchains + tools), and optionally **VS Code** with the nRF Connect extension.

## 1. Install west

West is a Python tool. Install it with pip:

```bash
pip3 install west
```

Verify:
```bash
west --version
# west, version 1.x.x
```

## 2. Initialize a Zephyr workspace

```bash
# Create a workspace directory
mkdir ~/zephyrproject && cd ~/zephyrproject

# Initialize from the Zephyr repo at a specific release
west init -m https://github.com/zephyrproject-rtos/zephyr --mr v3.7.0 .

# Pull all dependencies (Zephyr + HALs + modules)
west update

# Register Zephyr's CMake packages
west zephyr-export

# Install Python dependencies
pip3 install -r zephyr/scripts/requirements.txt
```

:::note
`west update` pulls around 2–3 GB. This is the full Zephyr tree with all hardware abstraction layers. It only runs once per workspace.
:::

## 3. Install the Zephyr SDK

The SDK contains the ARM, RISC-V, and Xtensa toolchains.

```bash
# Download the SDK (replace with latest version)
wget https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v0.16.8/zephyr-sdk-0.16.8_linux-x86_64.tar.xz

# Extract
tar xvf zephyr-sdk-0.16.8_linux-x86_64.tar.xz

# Run the setup script
cd zephyr-sdk-0.16.8
./setup.sh
```

The setup script installs the toolchains and registers the SDK path with CMake.

## 4. Verify the installation

```bash
# List all boards Zephyr supports — should return 1000+ results
west boards | wc -l

# Try building a sample
cd ~/zephyrproject
west build -b esp32_devkitc_wroom zephyr/samples/hello_world
```

If the build completes without errors, your environment is ready.

## VS Code setup (optional but recommended)

Install these extensions:
- **nRF Connect for VS Code** — build, flash, debug GUI for Espressif boards
- **C/C++** (Microsoft) — IntelliSense for Zephyr headers
- **DeviceTree** — syntax highlighting for `.dts` and `.overlay` files

:::tip
On macOS, replace `wget` with `curl -L -o` and install dependencies via Homebrew: `brew install cmake ninja python3 dtc`.
:::
