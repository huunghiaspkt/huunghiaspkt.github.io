## Content Reference Policy

When writing any documentation, tutorial, or blog post for this project, **always reference the official source** for technical claims. Do not invent specifications, pin numbers, API signatures, or feature descriptions.

### Primary reference sources (fetch before writing)

| Topic | Official reference |
|---|---|
| Zephyr RTOS | https://docs.zephyrproject.org/latest/ |
| Zephyr introduction | https://docs.zephyrproject.org/latest/introduction/index.html |
| Zephyr boards | https://docs.zephyrproject.org/latest/boards |
| Devicetree / DTS | https://docs.zephyrproject.org/latest/build/dts/index.html |
| Kconfig | https://docs.zephyrproject.org/latest/build/kconfig/index.html |
| Zephyr drivers API | https://docs.zephyrproject.org/latest/hardware/peripherals/index.html |
| West (meta-tool) | https://docs.zephyrproject.org/latest/develop/west/index.html |
| BLE / Bluetooth | https://docs.zephyrproject.org/latest/connectivity/bluetooth/index.html |
| Power management | https://docs.zephyrproject.org/latest/services/pm/index.html |
| MCUboot / OTA | https://docs.mcuboot.com/ |
| ESP32 (Espressif) | https://docs.espressif.com/projects/esp-idf/en/latest/ |
| ESP32 Zephyr boards | https://docs.zephyrproject.org/latest/boards/espressif/index.html |

### Rules

1. **Fetch the reference page first** using WebFetch before writing any page that makes technical claims.
2. **Link to the source** — every page should include at least one `:::info` or inline link pointing to the official doc.
3. **Don't guess** — if unsure about an API signature, Kconfig symbol name, or board identifier, fetch the docs.
4. **Keep it honest** — if something is from personal experience (e.g. a bug found during a real build), say so explicitly, not as a general rule.

---

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
