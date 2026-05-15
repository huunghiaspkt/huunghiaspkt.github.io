---
sidebar_position: 2
description: Set up a Zephyr development environment on Linux, macOS, or Windows — and learn the west commands you'll use every day.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Environment Setup & West

This guide walks you through setting up a complete Zephyr development environment from scratch,
then covers the west commands you'll use every single day.

:::note[Workspace location]
You can place your Zephyr workspace anywhere on your machine. Throughout this guide we use `/your/workspace/path` as a placeholder — replace it with wherever you want to keep your workspace (e.g. `/home/john/zephyr_ws` on Linux, `/Users/john/zephyr_ws` on macOS or `D:\projects\zephyr_ws` on Windows).
:::

**Minimum tool versions required:**

| Tool | Minimum version |
|---|---|
| CMake | 3.20.5 |
| Python | 3.12 |
| Devicetree compiler (`dtc`) | 1.4.6 |

<br/>

---

## Step 1 — Install system dependencies

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

Update your system first:

```bash
sudo apt update && sudo apt upgrade
```

Install all required packages:

```bash
sudo apt install --no-install-recommends \
  git cmake ninja-build gperf ccache dfu-util \
  device-tree-compiler wget python3-dev python3-venv \
  python3-tk xz-utils file make gcc gcc-multilib \
  g++-multilib libsdl2-dev libmagic1
```

:::note
On ARM64 systems (e.g. Raspberry Pi), omit `gcc-multilib` and `g++-multilib`.
:::

Verify your tool versions:

```bash
cmake --version   # must be >= 3.20.5
python3 --version # must be >= 3.12
dtc --version     # must be >= 1.4.6
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

Install [Homebrew](https://brew.sh) if you don't have it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

Install all required packages:

```bash
brew install cmake ninja gperf python3 python-tk \
  ccache qemu dtc libmagic wget openocd

echo 'export PATH="'$(brew --prefix)'/opt/python/libexec/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

:::warning[Apple Silicon only]
x86-64 macOS (Intel) is not supported by the Zephyr SDK installer. Use Apple Silicon (M1/M2/M3) or run Linux in a VM.
:::

Verify your tool versions:

```bash
cmake --version
python3 --version
dtc --version
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

**winget** is the Windows Package Manager — built into Windows 10 (1709+) and Windows 11.
It installs and updates tools from the command line, similar to `apt` on Linux or `brew` on macOS.

Open **PowerShell as Administrator** and install all required tools in one command:

```powershell
winget install --id Kitware.CMake --silent
winget install --id Ninja-build.Ninja --silent
winget install --id oss-winget.gperf --silent
winget install --id Python.Python.3.12 --silent
winget install --id Git.Git --silent
winget install --id oss-winget.dtc --silent
winget install --id wget.wget --silent
winget install --id 7zip.7zip --silent
```

Or chain them all into a single call:

```powershell
winget install Kitware.CMake Ninja-build.Ninja `
  oss-winget.gperf Python.Python.3.12 `
  Git.Git oss-winget.dtc wget.wget 7zip.7zip
```

:::tip[After installation]
Close and reopen PowerShell to pick up the new PATH entries before running any of the tools.
:::

Verify:

```powershell
cmake --version
python --version
dtc --version
```

</TabItem>
</Tabs>

<br/>

---

## Step 2 — Create a virtual environment and install west

West is the meta-tool that ships with Zephyr. It does two things:

- **Workspace management** — clones Zephyr and all its dependencies at the exact right versions
- **Build and flash CLI** — wraps `cmake`, `ninja`, and your programmer into single commands

Install it inside a Python virtual environment to keep it isolated from your system Python.

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
python3 -m venv /your/workspace/path/.venv
source /your/workspace/path/.venv/bin/activate
pip install west
```

:::tip
Add `source /your/workspace/path/.venv/bin/activate` to your `~/.bashrc` or `~/.zshrc` so west is active in every terminal session.
:::

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
python3 -m venv /your/workspace/path/.venv
source /your/workspace/path/.venv/bin/activate
pip install west
```

:::tip
Add `source /your/workspace/path/.venv/bin/activate` to your `~/.zprofile` so west is active in every terminal session.
:::

</TabItem>
<TabItem value="windows" label="🪟 Windows">

**PowerShell:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
python -m venv D:\your\workspace\path\.venv
D:\your\workspace\path\.venv\Scripts\Activate.ps1
pip install west
```

</TabItem>
</Tabs>

Verify west is installed:

```bash
west --version
# west, version 1.x.x
```

<br/>

---

## Step 3 — Initialize the Zephyr workspace

This step clones Zephyr v4.4.0 and all its dependencies (HALs, modules, bootloader).
**Expect 2–3 GB of downloads** — it only runs once per workspace.

```bash
west init -m https://github.com/zephyrproject-rtos/zephyr --mr v4.4.0 /your/workspace/path
cd /your/workspace/path
west update
west zephyr-export
```

:::note
Always use `west init` instead of `git clone`. West registers the manifest so that `west update` always restores the exact dependency tree — your project will build correctly years from now.
:::

Install the Python dependencies:

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
west packages pip --install
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
west packages pip --install
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

**PowerShell:**
```powershell
python -m pip install @((west packages pip) -split ' ')
```

</TabItem>
</Tabs>

<br/>

---

## Step 4 — Install the Zephyr SDK

The SDK contains the toolchains for ARM, RISC-V, Xtensa, and all other supported architectures.

```bash
cd /your/workspace/path/zephyr
west sdk install
```

`west sdk install` automatically downloads and sets up the correct SDK version for your Zephyr checkout.

<br/>

---

## Step 5 — Verify the installation

Build the `blinky` sample for your board. Replace `<your-board>` with your actual board name (e.g. `esp32_devkitc_wroom`, `nrf52840dk/nrf52840`):

```bash
cd /your/workspace/path/zephyr
west build -p always -b <your-board> samples/basic/blinky
```

If the build completes without errors, your environment is ready.

```bash
west boards | wc -l   # should return 1000+
```

<br/>

---

## West essentials

The commands you'll use every day:

```bash
# Build for a target board
west build -b esp32_devkitc_wroom app/

# Flash to connected hardware
west flash

# List all supported boards
west boards

# Filter boards by name
west boards | grep nrf52

# Build with a devicetree overlay
west build -b esp32_devkitc_wroom app/ -- \
  -DDTC_OVERLAY_FILE=boards/esp32_devkitc_wroom.overlay

# Inspect the final merged devicetree
cat build/zephyr/zephyr.dts
```

West figures out which compiler, linker, and programmer to use based on the board you specify — you never need to set `PATH` or pick a toolchain manually.

<br/>

---

## Updating Zephyr

```bash
# Pull all modules to the versions pinned in the manifest
west update

# Switch to a different Zephyr release
west update --mr v4.4.0
```

:::warning
After running `west update`, always rebuild from scratch. Cached build artifacts from the old Zephyr version will cause subtle build failures.
:::

<br/>

---

## Serial console — VS Code setup

To read `printf` / `printk` output from your board over USB, install the **Serial Monitor** extension in VS Code and set up the USB serial driver for your platform.

**Install the extension:**

Open VS Code, go to the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`), and search for **Serial Monitor** by Microsoft.

<img src="/img/vscode-serial-monitor.png" alt="VS Code Serial Monitor extension" style={{maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem'}} />

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

On Linux, serial port access requires adding your user to the `dialout` group:

```bash
sudo usermod -aG dialout $USER
```

Log out and back in for the change to take effect. Then verify:

```bash
groups | grep dialout
```

Linux includes CP210x, CH340, and FTDI drivers in the kernel — no additional installation needed.

</TabItem>
<TabItem value="macos" label="🍎 macOS">

Most ESP32 and nRF boards use one of these USB-to-serial chips. Install the driver that matches your board:

| Chip | Common boards | Driver |
|---|---|---|
| CP210x (Silicon Labs) | ESP32-DevKitC, many Espressif boards | [silabs.com/developers/usb-to-uart-bridge-vcp-drivers](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) |
| CH340 / CH341 | Cheaper ESP32 clones | [wch-ic.com](http://www.wch-ic.com/downloads/CH341SER_MAC_ZIP.html) |

After installing, plug in your board and verify the port appears:

```bash
ls /dev/cu.*
# e.g. /dev/cu.usbserial-0001
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

Windows requires a USB-to-serial driver. Install the one that matches your board's chip:

| Chip | Common boards | Driver |
|---|---|---|
| CP210x (Silicon Labs) | ESP32-DevKitC, many Espressif boards | [silabs.com/developers/usb-to-uart-bridge-vcp-drivers](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) |
| CH340 / CH341 | Cheaper ESP32 clones | [wch-ic.com](http://www.wch-ic.com/downloads/CH341SER_ZIP.html) |
| FTDI | Older and industrial boards | [ftdichip.com/drivers/vcp-drivers](https://ftdichip.com/drivers/vcp-drivers/) |

After installing, plug in your board and check **Device Manager → Ports (COM & LPT)** — your board should appear as a `COM` port (e.g. `COM3`).

:::tip[Not sure which chip your board uses?]
Check the board's product page or look for a small IC near the USB connector labelled `CP2102`, `CH340`, or `FT232`.
:::

</TabItem>
</Tabs>

Open the Serial Monitor in VS Code (`Terminal → Serial Monitor`), select the correct port, set the baud rate to **115200**, and connect.

<br/>

:::info[Official reference]
[docs.zephyrproject.org — Getting Started Guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html)
:::
