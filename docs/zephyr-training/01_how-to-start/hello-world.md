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

Go to your workspace and activate your virtual environment:

```bash
cd /your/workspace/path
source .venv/bin/activate
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

Open **Terminal** (`/Applications/Utilities/Terminal.app`) or **iTerm2** if you have it installed.

Go to your workspace and activate your virtual environment:

```bash
cd /your/workspace/path
source .venv/bin/activate
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

Use **PowerShell** — not cmd.exe. Open it by pressing `Win + X` and selecting **Terminal** or **Windows PowerShell**.

Go to your workspace and activate your virtual environment:

```powershell
cd D:\your\workspace\path
.venv\Scripts\Activate.ps1
```

</TabItem>
</Tabs>

<br/>

---

## Step 2 — Copy the sample

Zephyr ships with a `samples/` folder full of ready-to-build examples. Inside your workspace, the Hello World sample lives at:

```
zephyr/samples/hello_world/
```

From the workspace folder you're already in, copy it into a `devzone/` folder — this is where you'll keep all your personal projects, separate from the Zephyr source tree:

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
mkdir -p devzone
cp -r zephyr/samples/hello_world devzone/hello_world
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
mkdir -p devzone
cp -r zephyr/samples/hello_world devzone/hello_world
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

```powershell
New-Item -ItemType Directory -Force -Path devzone
Copy-Item -Recurse zephyr\samples\hello_world devzone\hello_world
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

## Step 3 — Build and flash

From your workspace folder, go into your copied sample and build it. Replace `<your-board>` with your board target — pick your board:

<BoardTabs>
<BoardTab value="esp32s3_devkitc">

```bash
west build -b esp32s3_devkitc/esp32s3/procpu .
```

</BoardTab>
<BoardTab value="efz_esp32s3">

```bash
west build -b efz_esp32s3/esp32s3/procpu .
```

</BoardTab>
</BoardTabs>

[Supported chip families](/docs/zephyr-training/how-to-start#supported-chip-families)

<Tabs groupId="os">
<TabItem value="linux" label="🐧 Linux" default>

```bash
cd devzone/hello_world
west build -b <your-board> .
west flash
```

</TabItem>
<TabItem value="macos" label="🍎 macOS">

```bash
cd devzone/hello_world
west build -b <your-board> .
west flash
```

</TabItem>
<TabItem value="windows" label="🪟 Windows">

```powershell
cd devzone\hello_world
west build -b <your-board> .
west flash
```

</TabItem>
</Tabs>

Expected output on the serial console:

<BoardTabs>
<BoardTab value="esp32s3_devkitc">

```
*** Booting Zephyr OS build v4.4.0 ***
Hello World! esp32s3_devkitc
```

</BoardTab>
<BoardTab value="efz_esp32s3">

```
*** Booting Zephyr OS build v4.4.0 ***
Hello World! efz_esp32s3
```

</BoardTab>
</BoardTabs>

<br/>

---

## Step 4 — Read the output with Serial Monitor

After flashing, open **Serial Monitor** in VS Code to see the output from your board:

1. Go to `Terminal → New Terminal` in VS Code
2. The **Serial Monitor** tab will appear at the bottom panel
3. Select your board's port:
   <BoardTabs>
   <BoardTab value="esp32s3_devkitc">

   The DevKitC's USB-UART bridge: `/dev/ttyUSB0` on Linux, `/dev/cu.usbserial-*` on macOS, `COM3` on Windows.

   </BoardTab>
   <BoardTab value="efz_esp32s3">

   The ESP32-S3's native USB: `/dev/ttyACM0` on Linux, `/dev/cu.usbmodem*` on macOS, `COMx` on Windows.

   </BoardTab>
   </BoardTabs>
4. Set the baud rate to **115200**
5. Click **Start Monitoring**

You should see the same `Hello World!` line as above.

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
