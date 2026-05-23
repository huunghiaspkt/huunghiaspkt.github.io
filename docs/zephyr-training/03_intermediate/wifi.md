---
sidebar_position: 11
description: Zephyr's wifi_mgmt API — connect, scan, handle events, get a DHCP lease. Examples run on the ESP32-S3 DevKitC.
---

# WiFi

Zephyr's **`wifi_mgmt` API** is a single, driver-agnostic interface for connecting to access points, scanning, and handling link events. Whatever WiFi part you're on — ESP32, nRF7002 + nRF host, ST WB55, NXP RW61x — the C code is the same; only the driver and a few Kconfig symbols change.

This page walks through that API with the **ESP32-S3 DevKitC** as the sample board, because it has built-in 2.4 GHz 802.11 b/g/n and no extra hardware to wire up.

:::info
References: [Zephyr WiFi API](https://docs.zephyrproject.org/latest/services/connectivity/networking/api/wifi.html) and the [`samples/net/wifi/shell`](https://github.com/zephyrproject-rtos/zephyr/tree/main/samples/net/wifi/shell) sample.
:::

<br/>

---

## prj.conf — networking + WiFi stack

The board file already enables the `&wifi` node on the DevKitC, so no overlay changes are needed — just the right Kconfig knobs:

```kconfig title="prj.conf"
# WiFi — generic plus the driver for our board
CONFIG_WIFI=y
CONFIG_WIFI_ESP32=y          # swap for CONFIG_WIFI_NRF70, etc. on other parts

# Networking stack
CONFIG_NETWORKING=y
CONFIG_NET_IPV4=y
CONFIG_NET_DHCPV4=y
CONFIG_NET_TCP=y
CONFIG_NET_UDP=y

# Buffer sizes — tune for your stack
CONFIG_NET_TX_STACK_SIZE=2048
CONFIG_NET_RX_STACK_SIZE=2048
CONFIG_NET_PKT_RX_COUNT=10
CONFIG_NET_PKT_TX_COUNT=10

# Useful during bring-up
CONFIG_NET_LOG=y
CONFIG_LOG=y
CONFIG_NET_SHELL=y
```

`CONFIG_NET_SHELL=y` adds the `wifi` and `net` shell commands — invaluable for debugging. From a serial console:

```
uart:~$ wifi scan
uart:~$ wifi connect "MySSID" "MyPassword"
uart:~$ net iface
```

<br/>

---

## Connect from C — `wifi_mgmt`

The API is event-driven. You request a connection, then handle the result via a `net_mgmt` callback:

```c
#include <zephyr/net/wifi.h>
#include <zephyr/net/wifi_mgmt.h>
#include <zephyr/net/net_if.h>
#include <zephyr/net/net_mgmt.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(wifi_app, LOG_LEVEL_INF);

static struct net_mgmt_event_callback wifi_cb;

static void wifi_event_handler(struct net_mgmt_event_callback *cb,
                               uint32_t event, struct net_if *iface)
{
    const struct wifi_status *status = cb->info;

    switch (event) {
    case NET_EVENT_WIFI_CONNECT_RESULT:
        if (status->status) {
            LOG_ERR("Connect failed: %d", status->status);
        } else {
            LOG_INF("Connected");
        }
        break;
    case NET_EVENT_WIFI_DISCONNECT_RESULT:
        LOG_INF("Disconnected");
        break;
    }
}

int wifi_connect(const char *ssid, const char *psk)
{
    struct net_if *iface = net_if_get_default();

    struct wifi_connect_req_params params = {
        .ssid          = (const uint8_t *)ssid,
        .ssid_length   = strlen(ssid),
        .psk           = (const uint8_t *)psk,
        .psk_length    = strlen(psk),
        .security      = WIFI_SECURITY_TYPE_PSK,
        .channel       = WIFI_CHANNEL_ANY,
    };

    return net_mgmt(NET_REQUEST_WIFI_CONNECT, iface, &params, sizeof(params));
}

int main(void)
{
    net_mgmt_init_event_callback(&wifi_cb, wifi_event_handler,
                                 NET_EVENT_WIFI_CONNECT_RESULT |
                                 NET_EVENT_WIFI_DISCONNECT_RESULT);
    net_mgmt_add_event_callback(&wifi_cb);

    wifi_connect("MySSID", "MyPassword");
    return 0;
}
```

This C code is portable across every Zephyr WiFi driver — swap the board, change nothing here.

<br/>

---

## Security types

```c
enum wifi_security_type {
    WIFI_SECURITY_TYPE_NONE,            /* Open network */
    WIFI_SECURITY_TYPE_PSK,             /* WPA2-PSK (most common) */
    WIFI_SECURITY_TYPE_PSK_SHA256,
    WIFI_SECURITY_TYPE_SAE,             /* WPA3-SAE */
    WIFI_SECURITY_TYPE_WAPI,
    WIFI_SECURITY_TYPE_EAP,             /* Enterprise */
};
```

Which types are actually supported is driver-dependent — check your part's datasheet. `WIFI_SECURITY_TYPE_SAE_AUTO` lets WPA3-SAE fall back to WPA2-PSK when the AP doesn't support it.

<br/>

---

## DHCP and getting the IP

Once `NET_EVENT_WIFI_CONNECT_RESULT` reports success, the link is up but you have no IP yet. With `CONFIG_NET_DHCPV4=y`, Zephyr starts a DHCP exchange automatically. Watch for the address:

```c
static struct net_mgmt_event_callback dhcp_cb;

static void dhcp_event_handler(struct net_mgmt_event_callback *cb,
                               uint32_t event, struct net_if *iface)
{
    if (event != NET_EVENT_IPV4_DHCP_BOUND) {
        return;
    }

    char ip[NET_IPV4_ADDR_LEN];
    net_addr_ntop(AF_INET, &iface->config.dhcpv4.requested_ip, ip, sizeof(ip));
    LOG_INF("IP: %s", ip);
}

/* in main() */
net_mgmt_init_event_callback(&dhcp_cb, dhcp_event_handler,
                             NET_EVENT_IPV4_DHCP_BOUND);
net_mgmt_add_event_callback(&dhcp_cb);
```

Now you have an IP — `socket()`, `connect()`, `send()` work as on any POSIX system.

<br/>

---

## Scanning

```c
struct wifi_scan_params params = { 0 };   /* defaults */
net_mgmt(NET_REQUEST_WIFI_SCAN, iface, &params, sizeof(params));
```

Results arrive via the `NET_EVENT_WIFI_SCAN_RESULT` event, one per AP. Wait for `NET_EVENT_WIFI_SCAN_DONE` to know the scan finished.

<br/>

---

## Disconnect

```c
net_mgmt(NET_REQUEST_WIFI_DISCONNECT, iface, NULL, 0);
```

Followed by `NET_EVENT_WIFI_DISCONNECT_RESULT` in your handler.

<br/>

---

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| Board hangs at boot when `CONFIG_WIFI=y` | Out of RAM. The WiFi stack typically needs tens of KB — drop log levels or reduce `CONFIG_NET_BUF_*_COUNT`. |
| `wifi connect` succeeds but no IP | DHCP timed out. Check `CONFIG_NET_DHCPV4=y` and that the AP responds (try a phone hotspot to rule out router config). |
| Driver isn't enabled even with `CONFIG_WIFI=y` | You also need the part-specific driver symbol — `CONFIG_WIFI_ESP32`, `CONFIG_WIFI_NRF70`, etc. |
| Random I2C/SPI failures while WiFi is busy | Some SoCs share clocks between radio and peripherals. On ESP32-S3 this is the same root cause as the BLE conflict — see [Power Management](./power-management). |

<br/>

---

## What you can build next

- HTTP client → `CONFIG_HTTP_CLIENT=y`, then `socket()` + `http_client_req()`
- MQTT to AWS / HiveMQ → `CONFIG_MQTT_LIB=y`, see `samples/net/mqtt_publisher`
- mDNS / Bonjour service discovery → `CONFIG_MDNS_RESPONDER=y`
- WiFi + BME280 → publish sensor readings; the [AIoT section](/docs/aiot/) covers this end-to-end
