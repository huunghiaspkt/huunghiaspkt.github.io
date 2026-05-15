---
sidebar_position: 3
description: Copy the Hello World sample from the Zephyr tree, build it, and run it on your board.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Hello World

The fastest way to get started is to use the sample that already ships with Zephyr.
You'll copy it out of the Zephyr tree, build it, and flash it to your board.

:::note[Workspace location]
Your Zephyr workspace can be anywhere on your machine. Throughout this guide we use `/your/workspace/path` as a placeholder — replace it with wherever you put your workspace (e.g. `/home/john/zephyr_ws` on Linux, `/Users/john/zephyr_ws` on macOS, or `D:\projects\zephyr_ws` on Windows).
:::

<br/>

---

## Step 1 — Open your terminal

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

Open your preferred terminal emulator — **GNOME Terminal**, **Konsole**, **Alacritty**, or any other.

Activate your virtual environment:

```bash
source /your/workspace/path/.venv/bin/activate
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

Open **Terminal** (`/Applications/Utilities/Terminal.app`) or **iTerm2** if you have it installed.

Activate your virtual environment:

```bash
source /your/workspace/path/.venv/bin/activate
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

Use **PowerShell** — not cmd.exe. Open it by pressing `Win + X` and selecting **Terminal** or **Windows PowerShell**.

Activate your virtual environment:

```powershell
D:\your\workspace\path\.venv\Scripts\Activate.ps1
```

</TabItem>
</Tabs>

<br/>

---

## Step 2 — Copy the sample

Zephyr ships with a `samples/` folder full of ready-to-build examples. The Hello World sample lives at:

```
/your/workspace/path/zephyr/samples/hello_world/
```

Copy it into a `devzone/` folder — this is where you'll keep all your personal projects, separate from the Zephyr source tree:

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
mkdir -p /your/workspace/path/devzone
cp -r /your/workspace/path/zephyr/samples/hello_world /your/workspace/path/devzone/hello_world
```

**Example** (if your workspace is at `/home/john/zephyr_ws`):
```bash
mkdir -p /home/john/zephyr_ws/devzone
cp -r /home/john/zephyr_ws/zephyr/samples/hello_world /home/john/zephyr_ws/devzone/hello_world
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
mkdir -p /your/workspace/path/devzone
cp -r /your/workspace/path/zephyr/samples/hello_world /your/workspace/path/devzone/hello_world
```

**Example** (if your workspace is at `/Users/john/zephyr_ws`):
```bash
mkdir -p /Users/john/zephyr_ws/devzone
cp -r /Users/john/zephyr_ws/zephyr/samples/hello_world /Users/john/zephyr_ws/devzone/hello_world
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

```powershell
New-Item -ItemType Directory -Force -Path "D:\your\workspace\path\devzone"
Copy-Item -Recurse "D:\your\workspace\path\zephyr\samples\hello_world" "D:\your\workspace\path\devzone\hello_world"
```

**Example** (if your workspace is at `D:\projects\zephyr_ws`):
```powershell
New-Item -ItemType Directory -Force -Path "D:\projects\zephyr_ws\devzone"
Copy-Item -Recurse "D:\projects\zephyr_ws\zephyr\samples\hello_world" "D:\projects\zephyr_ws\devzone\hello_world"
```

</TabItem>
</Tabs>

:::tip[Why copy instead of build in place?]
Building directly inside the Zephyr tree works, but keeping your apps in a separate `devzone/` folder keeps things clean and lets you track your own projects in a separate git repo.
:::

Your `devzone/hello_world/` folder should now look like this:

```
devzone/hello_world/
├── CMakeLists.txt
├── prj.conf
└── src/
    └── main.c
```

<br/>

---

## Step 3 — Look at the files

### CMakeLists.txt

```cmake title="CMakeLists.txt"
cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(hello_world)

target_sources(app PRIVATE src/main.c)
```

The `find_package(Zephyr ...)` line connects your app to the Zephyr build system.
West sets `ZEPHYR_BASE` automatically — you don't need to set it yourself.

### prj.conf

```kconfig title="prj.conf"
# Nothing needed for Hello World
# Add CONFIG_* symbols here to enable drivers and subsystems
```

### src/main.c

```c title="src/main.c"
#include <stdio.h>

int main(void)
{
    printf("Hello World! %s\n", CONFIG_BOARD);
    return 0;
}
```

`CONFIG_BOARD` expands to the board name you pass with `-b` — so building for `esp32_devkitc_wroom` prints `Hello World! esp32_devkitc_wroom`.

<br/>

---

## Step 4 — Build and flash

Navigate to your copied sample and build it. Replace `<your-board>` with your board ID (e.g. `esp32_devkitc_wroom`, `nrf52840dk/nrf52840`):

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
cd /your/workspace/path/devzone/hello_world
west build -b <your-board> .
west flash
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
cd /your/workspace/path/devzone/hello_world
west build -b <your-board> .
west flash
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

```powershell
cd D:\your\workspace\path\devzone\hello_world
west build -b <your-board> .
west flash
```

</TabItem>
</Tabs>

Expected output on the serial console:

```
*** Booting Zephyr OS build v4.4.0 ***
Hello World! esp32_devkitc_wroom
```

<br/>

---

## Step 5 — Read the output with Serial Monitor

After flashing, open **Serial Monitor** in VS Code to see the output from your board:

1. Go to `Terminal → New Terminal` in VS Code
2. The **Serial Monitor** tab will appear at the bottom panel
3. Select your board's port (e.g. `/dev/ttyUSB0` on Linux, `/dev/cu.usbserial-*` on macOS, `COM3` on Windows)
4. Set the baud rate to **115200**
5. Click **Start Monitoring**

You should see:

```
*** Booting Zephyr OS build v4.4.0 ***
Hello World! esp32_devkitc_wroom
```

:::tip[Serial Monitor not set up yet?]
Follow the [Serial Monitor setup guide](./environment#serial-console--vs-code-setup) in the Environment Setup page first.
:::

<br/>

---

## What `west build` actually does

1. Reads `CMakeLists.txt` and finds `find_package(Zephyr)`
2. Merges all Kconfig files into `build/zephyr/.config`
3. Compiles the final devicetree into `build/zephyr/zephyr.dts`
4. Compiles all source files and links `zephyr.elf`
5. Produces `zephyr.bin` / `zephyr.hex` ready for flashing

:::info
The `build/` directory is reusable. Run `west build` again after changing `main.c` and only changed files are recompiled. Use `west build -p always` to force a clean rebuild.
:::

<br/>

:::info[Official reference]
[docs.zephyrproject.org — Hello World sample](https://docs.zephyrproject.org/latest/samples/hello_world/README.html)
:::
