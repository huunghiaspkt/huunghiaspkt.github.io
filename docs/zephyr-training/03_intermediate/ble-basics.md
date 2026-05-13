---
sidebar_position: 5
description: Set up BLE advertising on ESP32, connect from a phone, and expose sensor data as a GATT characteristic.
---

# BLE Basics

Zephyr has a full BLE stack (based on Bluetooth Mesh / HCI). On ESP32, it's first-class: Espressif uses Zephyr as the basis for nRF Connect SDK.

This page covers the minimum viable BLE peripheral: advertise, accept a connection, and serve sensor data via a custom GATT characteristic.

## Kconfig

```kconfig title="prj.conf"
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_DEVICE_NAME="EmbeddedFun-01"
CONFIG_BT_DEVICE_APPEARANCE=768    # "Generic Sensor"
CONFIG_BT_MAX_CONN=1
```

## Advertising

```c
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/gap.h>

static const struct bt_data ad[] = {
    BT_DATA_BYTES(BT_DATA_FLAGS, BT_LE_AD_GENERAL | BT_LE_AD_NO_BREDR),
    BT_DATA(BT_DATA_NAME_COMPLETE, CONFIG_BT_DEVICE_NAME,
            sizeof(CONFIG_BT_DEVICE_NAME) - 1),
};

int main(void)
{
    bt_enable(NULL);
    bt_le_adv_start(BT_LE_ADV_CONN_FAST_1, ad, ARRAY_SIZE(ad), NULL, 0);
    /* ... */
}
```

## Custom GATT service

Define a service with a single readable+notifiable characteristic:

```c
#include <zephyr/bluetooth/gatt.h>

/* Custom 128-bit UUIDs */
#define BT_UUID_CUSTOM_SVC  BT_UUID_128_ENCODE(0x12345678, 0x1234, 0x5678, 0x1234, 0x56789abcdef0)
#define BT_UUID_TEMP_CHAR   BT_UUID_128_ENCODE(0x12345678, 0x1234, 0x5678, 0x1234, 0x56789abcdef1)

static float g_temperature = 0.0f;

static ssize_t read_temp(struct bt_conn *conn,
                          const struct bt_gatt_attr *attr,
                          void *buf, uint16_t len, uint16_t offset)
{
    return bt_gatt_attr_read(conn, attr, buf, len, offset,
                             &g_temperature, sizeof(g_temperature));
}

BT_GATT_SERVICE_DEFINE(sensor_svc,
    BT_GATT_PRIMARY_SERVICE(BT_UUID_DECLARE_128(BT_UUID_CUSTOM_SVC)),
    BT_GATT_CHARACTERISTIC(BT_UUID_DECLARE_128(BT_UUID_TEMP_CHAR),
                           BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY,
                           BT_GATT_PERM_READ, read_temp, NULL, &g_temperature),
    BT_GATT_CCC(NULL, BT_GATT_PERM_READ | BT_GATT_PERM_WRITE),
);

/* Update value and notify connected clients */
void ble_update_temperature(float temp)
{
    g_temperature = temp;
    bt_gatt_notify(NULL, &sensor_svc.attrs[1], &g_temperature, sizeof(g_temperature));
}
```

## Testing with nRF Connect

1. Flash your firmware
2. Open **nRF Connect** app (iOS or Android)
3. Scan — find `EmbeddedFun-01`
4. Connect → expand the custom service → read the characteristic
5. Enable notifications → see values update in real time

## Connection callbacks

```c
static void connected(struct bt_conn *conn, uint8_t err)
{
    if (err) {
        printk("Connection failed (err %u)\n", err);
    } else {
        printk("Connected\n");
    }
}

static void disconnected(struct bt_conn *conn, uint8_t reason)
{
    printk("Disconnected (reason %u)\n", reason);
    /* Restart advertising */
    bt_le_adv_start(BT_LE_ADV_CONN_FAST_1, ad, ARRAY_SIZE(ad), NULL, 0);
}

BT_CONN_CB_DEFINE(conn_callbacks) = {
    .connected    = connected,
    .disconnected = disconnected,
};
```

:::tip
Use `CONFIG_BT_DEVICE_NAME` in `prj.conf` to set the advertised name. It must be ≤ 29 bytes to fit in the advertising payload without an extended advertisement.
:::
