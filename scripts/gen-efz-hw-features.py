#!/usr/bin/env python3
"""Regenerate src/data/efz-hw-features.json from the EFZ-ESP32S3 devicetree.

The board page's "Supported features" table (<HwFeaturesTable>) reads this
file. Run it whenever boards/embeddedfun/efz_esp32s3/ changes in the fork:

    source ~/Private/embeddedfun-ws/.venv/bin/activate
    python scripts/gen-efz-hw-features.py

It configures zephyr/samples/hello_world for the board (devicetree only, no
compile) and lists every enabled node that has a binding, like Zephyr's own
zephyr:board-supported-hw directive.
"""
import json
import pickle
import subprocess
import sys
import tempfile
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote

SITE = Path(__file__).resolve().parent.parent
WS = SITE.parent                                     # the west workspace
ZEPHYR = WS / "zephyr"
OUT = SITE / "src/data/efz-hw-features.json"
BOARD = "efz_esp32s3/esp32s3/procpu"

TYPES = {"adc": "ADC", "bluetooth": "Bluetooth", "clock": "Clock control", "counter": "Counter",
         "cpu": "CPU", "crypto": "Crypto", "dma": "DMA", "flash_controller": "Flash controller",
         "gpio": "GPIO", "i2c": "I2C", "i2s": "I2S", "input": "Input",
         "interrupt-controller": "Interrupt controller", "led": "LED", "misc": "Miscellaneous",
         "mtd": "Flash", "pinctrl": "Pin control", "rng": "Entropy", "sd": "SD",
         "sdhc": "SD host controller", "sensor": "Sensor", "serial": "Serial controller",
         "watchdog": "Watchdog", "wifi": "Wi-Fi"}
# Linker plumbing, and PSRAM (enabled by the SoC dtsi but not fitted on this board).
DROP = {"zephyr,memory-region", "mmio-sram", "zephyr,mapped-partition", "zephyr,power-state",
        "espressif,esp32-psram"}
# Parts on the board even though their nodes sit under an on-chip bus.
ONBOARD = {"sensirion,sht3xd", "invensense,mpu6050", "zephyr,sdmmc-disk", "gpio-keys", "gpio-leds"}
# On-chip blocks whose nodes sit outside /soc.
ONCHIP = {"espressif,esp32-bt-hci", "espressif,esp32-wifi", "espressif,esp32-clock",
          "espressif,esp32-pinctrl"}
NOTE = {"invensense,mpu6050": " (MPU-6500 on this board)", "sensirion,sht3xd": " (SHT30 on this board)",
        "zephyr,sdmmc-disk": " (microSD slot)", "espressif,esp32-usb-serial": " (USB Serial/JTAG console)"}


def main():
    with tempfile.TemporaryDirectory() as build:
        subprocess.run(["west", "build", "-p", "-b", BOARD, "-d", build, "--cmake-only",
                        str(ZEPHYR / "samples/hello_world")], cwd=WS, check=True, stdout=subprocess.DEVNULL)
        sys.path.insert(0, str(ZEPHYR / "scripts/dts/python-devicetree/src"))
        edt = pickle.load(open(Path(build) / "zephyr/edt.pickle", "rb"))

    rows = OrderedDict()
    for n in edt.nodes:
        c = n.matching_compat
        if n.status != "okay" or not c or not n.binding_path or c in DROP:
            continue
        rel = n.binding_path.split("/dts/bindings/")[-1]
        cat = rel.split("/")[0]
        if c in ONBOARD:
            loc = "on-board"
        elif c in ONCHIP or n.path.startswith(("/soc", "/cpus")):
            loc = "on-chip"
        else:
            loc = "on-board"
        key = (cat, loc, c)
        if key not in rows:
            rows[key] = {
                "type": TYPES.get(cat, cat),
                "location": loc,
                "description": (n.description or "").strip().split("\n")[0].rstrip(".") + NOTE.get(c, ""),
                "compatible": c,
                "count": 0,
                "binding": "https://docs.zephyrproject.org/latest/build/dts/api/bindings/"
                           f"{rel.rsplit('/', 1)[0]}/{quote(c, safe='')}.html"
                           f"#std-dtcompatible-{c.replace(',', '-')}",
            }
        rows[key]["count"] += 1

    out = sorted(rows.values(), key=lambda r: (r["type"], r["location"], r["compatible"]))
    OUT.write_text(json.dumps(out, indent=2) + "\n")
    print(f"{OUT.relative_to(SITE)}: {len(out)} rows, {sum(r['count'] for r in out)} enabled nodes")


if __name__ == "__main__":
    main()
