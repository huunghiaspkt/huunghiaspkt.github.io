---
sidebar_position: 1
description: Test Zephyr firmware on your PC with no hardware — why it pays off, and the two ways to do it: ztest (C, in-firmware) and pytest (Python, host-driven).
---

# Testing Zephyr Firmware

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img src="/img/testing-analysis.png" alt="Zephyr testing analysis overview — test logs, results dashboard, failure analysis, and test reports" style={{maxWidth: '720px', width: '100%', borderRadius: '8px'}} />
</div>

A feature that *builds* has cleared the lowest bar there is — it's valid C. Whether it's *correct* is a different question entirely, and on firmware the wrong answer rarely shows up in a tidy log line. It shows up as a dead device on someone's desk, three steps into a flow nobody re-checked by hand.

A test is how you catch that at *your* desk instead — where the fix costs a coffee break, not a truck roll.

And here's the part that kills every excuse: **you don't need hardware.** Everything in this section runs on `native_sim` — your test compiles to an ordinary Linux program and finishes in milliseconds.

<br/>

---

## Why it's worth it

- **Firmware bugs are expensive.** A web bug ships a hotfix in minutes. A firmware bug ships a technician to a site.
- **You can't re-check by hand.** Dozens of releases, hundreds of features. "Did I break anything?" should take *seconds*, not a weekend of clicking.
- **Tests make you faster.** Sounds backwards; isn't. A green suite lets you refactor fearlessly. Without one you tiptoe — and tiptoeing is slow.

> In automotive, medical, and aerospace you literally **cannot ship** without test evidence (ISO 26262, IEC 62304, DO-178C). The report *is* the paperwork.

<br/>

---

## Two ways to test

Zephyr gives you two complementary approaches. Same runner (**Twister**), same `native_sim`, very different reach:

| | **ztest** | **pytest harness** |
|---|---|---|
| You write the test in | **C**, compiled into the firmware | **Python**, running on your PC |
| It can see | functions, variables, internal state | only what the device exposes — shell, serial, network |
| Perfect for | unit-testing logic and functions | interaction & system tests (shell, OTA, networking) |

One line to remember: **testing a function → ztest. Testing a behaviour → pytest.**

<br/>

---

## Your path

We'll carry one tiny example the whole way — an `add()` function — and test it both ways, so each step builds on the last instead of starting over.

1. **[How Zephyr testing works](./ztest/concepts.md)** — the mental model: two tools, one dead-simple contract between them. Read this first and everything after it becomes obvious.
2. **[Write & run your first test](./ztest/first-test.md)** — the hands-on ztest: four files, three macros, watch it pass *and* fail on purpose.
3. **[Testing from the outside: pytest](./pytest/index.md)** — when an in-firmware assert simply can't reach, drive the device from Python instead.

## Prerequisites

- Comfortable building and flashing with `west` — see [Zephyr Basic](/docs/zephyr-training/basic/)
- A working Zephyr environment (`native_sim` runs on your host, so no board needed)

:::tip
Short on time? The first two pages have you writing real, running tests in about ten minutes. Come to pytest the moment you hit something you can only observe from *outside* the firmware.
:::
