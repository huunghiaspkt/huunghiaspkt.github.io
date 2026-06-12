---
sidebar_position: 3
description: Drive WiFi from the Zephyr shell — scan, connect, and ping over the console with zero application code. Runs on the ESP32-S3.
---

# WiFi Shell

In production, you can't attach a debugger to a device sitting on a customer's shelf. The **Zephyr shell** is the next best thing: a small interactive console you compile *into* the firmware and reach over UART or USB — and once it's on, you can bring up WiFi and ping a server live, on the real device, without writing a line of networking code.

This is the first of a short series on the shell. Here we cover the **WiFi and networking commands** you get for free; later pages add other peripheral shells (ADC, …) and how to author your own custom commands.

We use the **ESP32-S3 DevKitC**, the same board as the [WiFi](/docs/zephyr-training/intermediate/wifi) page. This is the shell-flavoured companion to that page: there we called `wifi_mgmt` from C; here we drive it from a console.

:::info
References: [Zephyr Shell](https://docs.zephyrproject.org/latest/services/shell/index.html), [Network shell](https://docs.zephyrproject.org/latest/services/connectivity/networking/api/net_shell.html), [WiFi management](https://docs.zephyrproject.org/latest/services/connectivity/networking/api/wifi.html), and the [`samples/net/wifi/shell`](https://github.com/zephyrproject-rtos/zephyr/tree/main/samples/net/wifi/shell) sample this is based on.
:::

<br/>

---

## Turn it on — and get commands for free

The thing that surprises people: the upstream `samples/net/wifi/shell` has an **empty `main()`**. Every `wifi` and `net` command comes from shell *modules* you enable in Kconfig — no application code required.

```kconfig title="prj.conf"
# Shell subsystem
CONFIG_SHELL=y

# Networking stack
CONFIG_NETWORKING=y
CONFIG_NET_IPV4=y
CONFIG_NET_DHCPV4=y
CONFIG_NET_TCP=y
CONFIG_NET_UDP=y

# Shell modules: `net ...` (incl. ping) and `wifi ...`
CONFIG_NET_SHELL=y
CONFIG_NET_L2_WIFI_SHELL=y

# WiFi: generic API + the ESP32 driver
CONFIG_WIFI=y
CONFIG_WIFI_ESP32=y
```

The ESP32-S3 needs one extra knob so it grabs a DHCP lease automatically once it associates — put it in a board-specific overlay so it only applies to this target:

```kconfig title="boards/esp32s3_devkitc_procpu.conf"
CONFIG_ESP32_WIFI_STA_AUTO_DHCPV4=y
```

Build, flash, and open the monitor:

```bash
west build -p always -b esp32s3_devkitc/esp32s3/procpu .
west flash
west espressif monitor
```

<br/>

---

## WiFi: scan and connect

The `wifi` command module is now live. Scan, then connect:

```text title="UART console"
uart:~$ wifi scan
Scan requested

Num  | SSID                             (len) | Chan | RSSI | Sec
1    | kapoueh!                         8     | 1    | -93  | WPA/WPA2
2    | gksu                             4     | 1    | -26  | WPA/WPA2
----------
Scan request done

uart:~$ wifi connect -s "gksu" -p SecretStuff -k 1
Connection requested

Connected
```

Connect takes flags, not positional arguments: `-s` is the SSID (quote it if it has spaces), `-p` the passphrase, and `-k` the key-management type — `1` is WPA2-PSK, the common home-network case (`0` open, `4` WPA3-SAE-H2E, `9` WPA-PSK; run `wifi connect -h` for the full list). For an open network, drop `-p` and `-k`.

:::tip
Type `wifi` and hit Tab — the shell autocompletes the sub-commands (`scan`, `connect`, `disconnect`, `status`, `ap`, …). `wifi status` is the fastest way to confirm you're associated and on which channel.
:::

<br/>

---

## Ping: is the link actually working?

`CONFIG_NET_SHELL=y` brings in the `net` command module, and with it **`net ping`** — Zephyr's own ICMP echo implementation. After `wifi connect`, the ESP32 pulls a DHCP lease, so you can reach the internet straight away:

```text title="UART console"
uart:~$ net iface

Interface wlan0 (0x3fca1234) (WiFi) [1]
==================================
IPv4 unicast addresses (max 1):
        192.168.1.42 DHCP preferred

uart:~$ net ping 8.8.8.8
PING 8.8.8.8
28 bytes from 8.8.8.8 to 192.168.1.42: icmp_seq=0 ttl=116 time=24 ms
28 bytes from 8.8.8.8 to 192.168.1.42: icmp_seq=1 ttl=116 time=22 ms
28 bytes from 8.8.8.8 to 192.168.1.42: icmp_seq=2 ttl=116 time=23 ms
```

`net ping <host>` is the first thing to run when "the device won't talk to the cloud." It isolates the problem fast: ping the gateway, then a public IP, then a hostname — wherever it fails is your layer.

:::info
`net ping` is part of the network shell — there's no separate "ping" Kconfig symbol to hunt for. It needs ICMPv4, which `CONFIG_NET_IPV4` pulls in automatically.
:::

<br/>

---

## How it works — no app code

This sample's [`main()`](https://github.com/huunghiaspkt/efzephyr-samples/tree/main/04_advanced/wifi_shell) just prints a hint; the `wifi` and `net` modules do everything else. You never write a line of networking or command-parsing code — that's the whole point of the built-in shells.

:::info
The built-in `wifi scan` is **asynchronous**: the command returns immediately with `Scan requested`, and results stream in afterwards as `net_mgmt` events (`NET_EVENT_WIFI_SCAN_RESULT`, then `NET_EVENT_WIFI_SCAN_DONE`) — which is why the table prints on its own lines a moment later. The same event model is covered on the [WiFi](/docs/zephyr-training/intermediate/wifi) page.
:::

<br/>

---

## What else you get for free

Two more built-in modules earn their flash on every build:

```text title="UART console"
uart:~$ kernel threads        # stacks, states, CPU usage per thread
uart:~$ kernel uptime
uart:~$ device list           # every device and whether it initialised
uart:~$ hwinfo devid          # unique chip ID — handy for provisioning
```

`device list` is the fastest way to catch a peripheral that failed to come up — it shows the init status of every driver, so a sensor that's silently `DT` but never `ready` jumps out.

<br/>

---

## Shipping it — the production angle

A shell is a debugging superpower and a security liability in the same binary. Treat it like one.

**Gate it behind your own Kconfig.** Don't ship an open root console on a fielded device. Put the shell behind a build option so production images leave it out — but factory and RMA images keep it:

```kconfig title="Kconfig"
config EF_DIAG_SHELL
    bool "Enable diagnostic shell (factory/RMA builds only)"
    select SHELL
    select NET_SHELL
    select NET_L2_WIFI_SHELL
```

A production build then sets `CONFIG_EF_DIAG_SHELL=n`, and the whole console — `wifi`, `net`, and the rest — drops out of the image entirely.

:::warning
The shell runs commands with no authentication by default. Anyone with physical access to the UART can read state and trigger actions. For a device that must keep a console in the field, look at `CONFIG_SHELL_CMD_ROOT` to restrict the command set, or front it with `CONFIG_SHELL_START_OBSCURED` / a login. The safest default is still **off in production**.
:::

**Mind the cost.** The shell plus the net/wifi command modules pull in a non-trivial amount of flash and RAM (each module registers command tables and needs a dedicated stack — note `CONFIG_SHELL_STACK_SIZE` in `prj.conf`). On a tight part, that's real budget — another reason to compile it out of the shipping image.

**Out of UART pins?** The shell isn't tied to a UART. `CONFIG_SHELL_BACKEND_RTT` runs the console over the SWD/JTAG debug channel, and the serial backend can sit on a USB CDC-ACM device instead of a physical UART — the device then enumerates as a virtual COM port. Useful when the UART is already spoken for by something else.

:::info
Source for the symbols above: the [Zephyr Shell docs](https://docs.zephyrproject.org/latest/services/shell/index.html) and `subsys/shell/backends/Kconfig.backends`. The *gate-it-in-production* guidance is editorial — a deployment practice, not a Zephyr API.
:::

<br/>

---

## Recap

- The shell is a **diagnostic console compiled into the firmware** — your in-field replacement for a debugger.
- `CONFIG_NET_L2_WIFI_SHELL` and `CONFIG_NET_SHELL` give you `wifi scan`, `wifi connect`, and `net ping` with **zero application code**.
- `wifi connect` takes **flags** (`-s`/`-p`/`-k`), and `wifi scan` reports its results **asynchronously**.
- **Gate the shell behind a Kconfig** and ship it *off* in production. It's a debugging tool, not a product feature.
- Authoring your **own** commands (and other peripheral shells like ADC) is a separate topic — see the upcoming **Custom Shell** page.

Next: pair this with the [Watchdog](./watchdog) page — a `kernel` shell that reads the reset cause after a watchdog fire is one of the most useful five minutes you'll spend debugging a field hang.
