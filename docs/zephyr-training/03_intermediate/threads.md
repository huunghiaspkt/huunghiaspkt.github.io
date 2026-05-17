---
sidebar_position: 9
description: Share data safely between Zephyr threads — semaphores, mutexes, message queues, and work queues.
---

# Thread Synchronization

Thread creation basics are covered in [Threads (Basic)](../basic/threads). This page focuses on what comes next: **safely sharing data and signaling between threads**.

<br/>

---

## Semaphores — signaling between threads

```c
static K_SEM_DEFINE(data_ready, 0, 1);  /* initial=0, limit=1 */

/* Producer thread */
void sensor_thread(void *a, void *b, void *c)
{
    while (1) {
        fetch_sensor_data();
        k_sem_give(&data_ready);   /* signal consumer */
        k_sleep(K_SECONDS(10));
    }
}

/* Consumer thread */
void ble_thread(void *a, void *b, void *c)
{
    while (1) {
        k_sem_take(&data_ready, K_FOREVER);  /* wait for signal */
        update_gatt_characteristic();
    }
}
```

<br/>

---

## Mutexes — protecting shared data

```c
static K_MUTEX_DEFINE(data_mutex);
static float shared_temperature;

void writer_thread(void *a, void *b, void *c)
{
    while (1) {
        float temp = read_sensor();
        k_mutex_lock(&data_mutex, K_FOREVER);
        shared_temperature = temp;
        k_mutex_unlock(&data_mutex);
        k_sleep(K_SECONDS(5));
    }
}

void reader_thread(void *a, void *b, void *c)
{
    while (1) {
        k_mutex_lock(&data_mutex, K_FOREVER);
        float t = shared_temperature;
        k_mutex_unlock(&data_mutex);
        printk("Temp: %.2f\n", t);
        k_sleep(K_SECONDS(1));
    }
}
```

<br/>

---

## Message queues — passing data between threads

Safer than shared variables — no mutex needed:

```c
struct sensor_msg {
    float temperature;
    float humidity;
};

K_MSGQ_DEFINE(sensor_msgq, sizeof(struct sensor_msg), 4, 4);

/* Producer */
struct sensor_msg msg = {.temperature = 24.3f, .humidity = 52.1f};
k_msgq_put(&sensor_msgq, &msg, K_NO_WAIT);

/* Consumer */
struct sensor_msg rx;
k_msgq_get(&sensor_msgq, &rx, K_FOREVER);
```

<br/>

---

## Work queues — deferring work from interrupts

GPIO interrupts run in interrupt context. Use a work queue to hand off to thread context:

```c
static struct k_work button_work;

void button_work_fn(struct k_work *work)
{
    /* Safe to do real work here */
    printk("Button handled in thread context\n");
}

void button_isr(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{
    /* Fast — just submit the work */
    k_work_submit(&button_work);
}

int main(void)
{
    k_work_init(&button_work, button_work_fn);
    /* ... set up GPIO interrupt ... */
}
```

:::warning
**Stack overflow** is the most common threading bug in Zephyr. If your board resets or behaves strangely, increase `STACK_SIZE`. Enable `CONFIG_THREAD_ANALYZER=y` to measure actual stack usage.
:::

<br/>

---

## Thread priorities

Lower number = higher priority. Priority 0 is the highest. The idle thread runs at the lowest priority.

```kconfig
# Enable stack overflow detection
CONFIG_STACK_SENTINEL=y

# Print stack usage at runtime
CONFIG_THREAD_ANALYZER=y
CONFIG_THREAD_ANALYZER_AUTO=y
```
