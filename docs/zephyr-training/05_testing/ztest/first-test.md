---
sidebar_position: 2
sidebar_label: Your first test
description: Write a real Zephyr test with ztest, run it on native_sim with Twister, watch it pass, then break it on purpose to watch it fail.
---

# Write & Run Your First Test

You've got the model — [ztest writes the checks, Twister runs them](./concepts.md), joined by nothing but a fixed `PASS`/`FAIL` text. Time to make it real: a function, a test, and the small thrill of watching it go green — then red on purpose, because a test you've never seen fail is a test you don't trust.

No hardware. The whole thing runs on your laptop in seconds.

:::tip[Grab the sample]
The complete, runnable project is on GitHub — [`05_ztest/ztest_calc`](https://github.com/huunghiaspkt/efzephyr-samples/tree/main/05_ztest/ztest_calc). Clone it and run, or build the four files below yourself.
:::

<br/>

---

## The 3 macros you actually need

Forget the 5-macro table in the docs. To start, exactly three things:

```c
ZTEST_SUITE(suite_name, NULL, NULL, NULL, NULL, NULL);  // a group of tests
ZTEST(suite_name, test_name) { ... }                    // one test
zassert_equal(expected, actual, "msg");                 // the check
```

The `NULL`s in `ZTEST_SUITE` are optional setup/teardown hooks — ignore them for now.

Every test follows **Arrange → Act → Assert**:

```c
ZTEST(math_tests, test_add)
{
    int result = add(2, 3);              // Act: call the thing under test
    zassert_equal(5, result, "2+3==5");  // Assert: check it
}
```

<br/>

---

## The function we'll test

Something tiny and real — an `add()`:

**`src/calc.c`**
```c
#include "calc.h"

int add(int a, int b)
{
    return a + b;
}
```

**`include/calc.h`**
```c
#ifndef CALC_H
#define CALC_H
int add(int a, int b);
#endif
```

<br/>

---

## The four files

Tests live in a `tests/` folder, named after what they test (`test_*`). You need **four files**:

```
ztest_calc/
├── include/
│   └── calc.h
├── src/
│   └── calc.c
└── tests/
    ├── CMakeLists.txt      ← tells Zephyr what to build
    ├── prj.conf            ← turns ztest on
    ├── testcase.yaml       ← tells Twister where & how to run
    └── test_calc.c         ← your actual tests
```

**`tests/test_calc.c`** — the tests:
```c
#include <zephyr/ztest.h>
#include "calc.h"

ZTEST_SUITE(calc_tests, NULL, NULL, NULL, NULL, NULL);

ZTEST(calc_tests, test_add_positives)
{
    zassert_equal(5, add(2, 3), "2 + 3 should be 5");
}

ZTEST(calc_tests, test_add_negatives)
{
    zassert_equal(-7, add(-3, -4), "-3 + -4 should be -7");
}
```

**`tests/prj.conf`** — one line turns the framework on:
```kconfig
CONFIG_ZTEST=y
```

**`tests/CMakeLists.txt`** — note we pull in the file under test (`../src/calc.c`):
```cmake
cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(test_calc)

target_include_directories(app PRIVATE ../include)
target_sources(app PRIVATE test_calc.c)
target_sources(app PRIVATE ../src/calc.c)
```

**`tests/testcase.yaml`** — the scenario name is `calc.testing.ztest` (call it whatever you like):
```yaml
tests:
  calc.testing.ztest:
    platform_allow: [native_sim]
    integration_platforms: [native_sim]
    tags: test_framework
```

> 💡 `native_sim` builds your test as a normal Linux program that runs on your PC. No board, no flashing, results in milliseconds. The perfect place to learn.

<br/>

---

## Run it 🏃

From the project root:

```bash
west twister -v -n -T tests/
```

Flag cheat-sheet:

| Flag | Does |
|------|------|
| `-v` | verbose — actually shows you `PASS` / `FAIL` |
| `-n` | reuse the output dir (no `twister-out.1`, `.2`… piling up) |
| `-T` | the folder to scan for tests |

If everything's wired up, Twister builds, runs, and reports:

```text
INFO - 1/1 native_sim    calc.testing.ztest    PASSED (native 0.005s)
INFO - 1 of 1 test configurations passed (100.00%), 0 failed ...
```

Want the actual ztest console (the `START`/`PASS` lines)? Run the built binary directly:

```bash
# the exact path depends on your workspace, so just locate and run it:
$ $(find twister-out -name zephyr.exe)
*** Booting Zephyr OS ***
Running TESTSUITE calc_tests
===================================================================
START - test_add_negatives
 PASS - test_add_negatives in 0.000 seconds
===================================================================
START - test_add_positives
 PASS - test_add_positives in 0.000 seconds
===================================================================
TESTSUITE calc_tests succeeded

------ TESTSUITE SUMMARY START ------
SUITE PASS - 100.00% [calc_tests]: pass = 2, fail = 0, skip = 0, total = 2
------ TESTSUITE SUMMARY END ------

PROJECT EXECUTION SUCCESSFUL
```

🎉 You just ran your first Zephyr tests.

<br/>

---

## ⚠️ The gotcha that trips up everyone

You run Twister and see **no test results** — just build info. Panic.

Usual cause: `build_only: true` in your `testcase.yaml`. That tells Twister to **compile but not run**. Remove it (or set it `false`) and Twister builds *and* runs. Build-only is useful in CI to catch compile errors fast, but for local dev you want it gone.

The other "where are my results?" cause: forgetting `-v`. Without it Twister stays quiet about individual tests.

<br/>

---

## What a failure looks like (the good part)

A test you've never seen fail is a test you don't trust. Break one on purpose:

```c
ZTEST(calc_tests, test_broken)
{
    zassert_equal(6, add(2, 3), "pretend 2+3==6");  // it's 5. this WILL fail.
}
```

Run again — Twister flags it:

```text
INFO - 1/1 native_sim    calc.testing.ztest    FAILED rc=1
```

And the binary tells you *exactly* where:

```text
START - test_broken
    Assertion failed at test_calc.c:18: calc_tests_test_broken: (6 not equal to add(2, 3))
pretend 2+3==6
 FAIL - test_broken in 0.000 seconds
...
SUITE FAIL - 66.67% [calc_tests]: pass = 2, fail = 1, skip = 0, total = 3
```

**File, line, reason.** That's the payoff — a failing test points a finger straight at the broken line. Delete `test_broken` and you're green again.

<br/>

---

## Assertions you'll reach for constantly

`zassert_equal` is the workhorse, but there are more:

| Macro | Checks |
|-------|--------|
| `zassert_true(cond)` | condition is true |
| `zassert_equal(a, b)` | `a == b` |
| `zassert_not_null(p)` | pointer isn't NULL |
| `zassert_ok(rc)` | return code is 0 |
| `zassert_within(v, ref, delta)` | `v` is near `ref` (great for sensors) |

(For the difference between `zassert` / `zexpect` / `zassume`, see [how it works](./concepts.md).)

<br/>

---

## Two more handy commands

**List tests without running them:**
```bash
west twister --list-tests -T tests/
```

**Skip — don't hide.** A test that can't run on a platform shouldn't vanish behind `#ifdef` — report a skip so it still shows in the count (honesty = traceability):
```c
ZTEST(calc_tests, test_hw_only)
{
    Z_TEST_SKIP_IFDEF(CONFIG_NO_HARDWARE);
    /* ... */
}
```

<br/>

---

## Recap

1. Four files in `tests/` (`test_*.c`, `prj.conf`, `CMakeLists.txt`, `testcase.yaml`) + three macros (`ZTEST_SUITE`, `ZTEST`, `zassert_equal`).
2. Run with `west twister -v -n -T tests/` on `native_sim`.
3. No results? You probably have `build_only: true` or forgot `-v`.
4. Break a test on purpose once — the file:line failure is what makes it click.

That's the whole loop — write, run, break, fix. Everything after this is just *more tests*. ✅

But notice the ceiling: ztest can reach anything you can call from C, and nothing else. A lot of firmware behaviour lives *outside* the binary — what a shell command prints, what crosses the serial line, whether an OTA actually lands. For those you stop poking from the inside and drive the device from your PC → [**Testing from the outside: pytest**](../pytest/index.md).

---

*Source: [Zephyr Test Framework docs](https://docs.zephyrproject.org/latest/develop/test/ztest.html)*
