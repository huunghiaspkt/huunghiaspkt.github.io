---
sidebar_position: 1
sidebar_label: How it works
description: The mental model behind Zephyr testing — ztest writes the checks, Twister runs them, and a fixed text format is the only thing connecting the two.
---

# How Zephyr Testing Works

You're sold on testing — if not, [back up a page](../index.md). So how does Zephyr actually turn *"I want to prove `add(2, 3)` is 5"* into a green checkmark on your screen?

It comes down to **two tools and one almost embarrassingly simple contract** between them. Get this picture in your head and the next page is just typing.

<br/>

---

## Two tools, not one

The most common mix-up in Zephyr testing: assuming "ztest" is the whole story. It isn't. There are **two** tools, and they do completely different jobs.

> **ztest** — the framework you *write tests in*. C macros, `#include <zephyr/ztest.h>`.
> **Twister** — the tool that *builds, runs, and reads the results*. `west twister`, on your PC.

ztest is the *what you write*. Twister is the *what runs it*. One lives inside your source code; the other is a command you type.

| | ztest | Twister |
|---|-------|---------|
| Lives in | your C source | your terminal (`west twister`) |
| Its job | write tests + assertions | build, run, collect pass/fail |
| Form | C macros | command-line tool |

<br/>

---

## How they talk to each other

Here's the whole machine — two tools, four steps:

<div style={{textAlign: 'center', margin: '1.5rem 0'}}>
  <img src="/img/testing-machine.svg" alt="The ztest + Twister loop: Twister builds and runs the test binary on the target, the binary prints fixed START/PASS/FAIL text to the console, Twister greps that text and produces a pass/fail report" style={{maxWidth: '720px', width: '100%'}} />
</div>

Now the part that surprises everyone: **Twister doesn't understand C.** It never parses your code. The only thing connecting your test to the report is **plain text on a console**.

> **ztest prints a fixed text format. Twister greps that text. That's the entire contract.** 🪄

When a test runs, ztest prints something like:

```text
START - test_add
 PASS - test_add in 0.000 seconds
START - test_buffer
    Assertion failed at test_calc.c:18: (6 not equal to add(2, 3))
 FAIL - test_buffer in 0.000 seconds
```

`START - <name>`, then `PASS` or `FAIL`. You never write those lines — the macros emit them. Which means **every Zephyr test on Earth prints identically**, and that's the trick that lets one tool run thousands of tests it knows nothing about. The bonus: a failure prints **file, line, and reason**, so you land on the broken statement instantly instead of bisecting by hand.

<br/>

---

## Three ways to assert

You'll write assertions constantly. There are three families, and the only thing that differs is *what happens when one fails*:

| Macro | On failure |
|---|---|
| `zassert_*` | ❌ **stop** the test right now |
| `zexpect_*` | 📝 **note it, keep going** — the test still fails at the end |
| `zassume_*` | ⏭️ **skip** the test |

> **assert = stop · expect = collect · assume = skip**

Reach for `zassert_*` 95% of the time: check a thing, and the instant it's wrong, stop the test right there.

<br/>

---

## Integration or unit?

One last fork before we build. ztest runs your test in one of two styles:

- **Integration** — your code runs *inside* a real Zephyr image (a board, or `native_sim`). Best for how modules actually behave together: timers, queues, drivers.
- **Unit** — *just* the one module, compiled on its own, everything around it stubbed out (Zephyr ships [FFF](https://github.com/meekrosoft/fff) for the mocks). Faster and surgical, but more wiring. Linux-only.

👉 **Start with integration on `native_sim`.** Reach for unit tests the day a module gets gnarly enough that you want it alone on an island.

<br/>

---

## Recap

- **ztest** writes the checks (C). **Twister** runs them (`west twister`).
- They're joined by nothing but a fixed `START` / `PASS` / `FAIL` text format.
- Every failure hands you file + line + reason, free.
- Default to integration tests on `native_sim`.

That's the entire mental model. Let's make it real → [**Write & run your first test**](./first-test.md): four files, three macros, and a test you'll watch pass *and* fail. ✅

---

*Source: [Zephyr Test Framework docs](https://docs.zephyrproject.org/latest/develop/test/ztest.html)*
