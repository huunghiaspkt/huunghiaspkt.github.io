---
sidebar_position: 3
description: The most common devicetree mistakes and how to fix them fast.
---

# Common Mistakes

These are the errors that waste the most time when starting with Zephyr devicetree. Every one of them produces a confusing build error or a silent runtime failure.

---

## 1. Forgetting `status = "okay"`

**Symptom:** `device_is_ready()` returns false. Device never initializes.

**Cause:** Every node in the SoC DTS defaults to `disabled`. Your overlay must explicitly enable the parent peripheral.

```dts
/* Wrong — i2c0 stays disabled */
&i2c0 {
    mysensor@44 {
        compatible = "vendor,mysensor";
        reg = <0x44>;
    };
};

/* Correct */
&i2c0 {
    status = "okay";   /* ← add this */
    mysensor@44 {
        compatible = "vendor,mysensor";
        reg = <0x44>;
    };
};
```

---

## 2. Wrong CONFIG_ symbol for the driver

**Symptom:** Build succeeds, but `device_is_ready()` returns false at runtime.

**Cause:** The device node exists in the DTS, but the driver wasn't compiled because `CONFIG_SHT3XD=y` is missing from `prj.conf`.

**Fix:** Every `compatible` string has a corresponding Kconfig symbol. Find it:

```bash
grep -r "sensirion,sht3xd" zephyr/drivers/ --include="*.c" -l
```

Then check the `Kconfig` file in that driver directory for the symbol name.

:::info
The error looks like a DTS problem but it's actually a Kconfig problem. If `DEVICE_DT_GET` compiles but the device isn't ready at runtime, your driver isn't compiled.
:::

---

## 3. 8-bit I2C address instead of 7-bit

**Symptom:** I2C reads/writes succeed but return wrong data, or `i2c_write()` returns `-EIO`.

**Cause:** DTS uses 7-bit addresses. Datasheets often list 8-bit (shifted) addresses.

```dts
/* Wrong — 0x88 is the 8-bit write address */
mysensor@88 { reg = <0x88>; }

/* Correct — 0x44 is the 7-bit address (0x88 >> 1) */
mysensor@44 { reg = <0x44>; }
```

---

## 4. Unit address doesn't match `reg`

**Symptom:** DTS build error: "unit address and first address in 'reg' (0x44) are not equal"

**Cause:** The `@` in the node name must exactly match the `reg` value.

```dts
/* Wrong */
mysensor@44 { reg = <0x45>; }

/* Correct */
mysensor@44 { reg = <0x44>; }
```

---

## 5. Overlay file name doesn't match board name

**Symptom:** Your overlay is silently ignored. No errors, but your sensor node isn't in the final DTS.

**Cause:** Overlay filename must be `boards/<board-name>.overlay` where `<board-name>` is the exact string you pass to `-b`.

```bash
# Board name:
west build -b esp32_devkitc_wroom .

# Overlay must be at:
boards/esp32_devkitc_wroom.overlay
```

**Debug:** Run `cat build/zephyr/zephyr.dts | grep mysensor` after build. If nothing appears, your overlay wasn't picked up.

---

## 6. Pinctrl missing for PWM/SPI/UART

**Symptom:** Build error about missing `pinctrl-0` property.

**Cause:** Zephyr 3.4+ requires explicit `pinctrl` nodes for most peripherals. The board DTS may not include them.

```dts
/* You need to add the pinctrl node yourself */
&pinctrl {
    pwm0_default: pwm0_default {
        group1 {
            psels = <NRF_PSEL(PWM_OUT0, 0, 13)>;
        };
    };
};

&pwm0 {
    status = "okay";
    pinctrl-0 = <&pwm0_default>;
    pinctrl-names = "default";
};
```

Check `dts/bindings/pwm/nordic,nrf-pwm.yaml` for the required properties.

---

## Debugging checklist

When a devicetree issue is unclear, run through this list:

1. `cat build/zephyr/zephyr.dts | grep <your-node-label>` — is the node present?
2. `cat build/zephyr/.config | grep CONFIG_<DRIVER>` — is the driver compiled?
3. Does `status = "okay"` appear on the parent peripheral?
4. Does `reg` match the `@` address?
5. Is the `compatible` string correct (check the YAML binding filename)?
