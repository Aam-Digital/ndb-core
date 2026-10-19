---
name: figma-mockups
description: Design mockups, screens or UI variants in Figma, built in the Aam Digital design system file so they reuse the real components and tokens. Use when someone asks for a Figma mockup, a Figma screen design or UI variants in Figma. Needs the Figma tools (`use_figma`) to be available.
argument-hint: <issue or description of the screens> (optional)
---

# Mockups in Figma

For a quick clickable proposal to discuss on an issue, use `/design-prototype` instead.
This skill is for designs that are built in Figma.

Always load the `figma-use` and `figma-generate-design` skills before any `use_figma` call.

## Rules

- **File key:** ask the user for the key of the "Aam Digital — Design System" file.
- **Where to build:** add a dedicated, clearly labelled new page (for example
  `📋 <Feature> — Mockups (#<issue>)`). Never edit the canonical `📄 Screens` page, it holds
  the reference screens (Dashboard, Entity List, Entity Details). Confirm with the user
  before writing into this shared file.
- **Use the design system, do not hardcode.** The tokens are local variables in this file
  (collections `Color / Semantic`, `Color / Status (w-levels)`, `Spacing`, `Radius`). Bind
  colors with `setBoundVariableForPaint` and spacing or radius with `setBoundVariable`.
  Find the IDs with `getLocalVariableCollectionsAsync` or by inspecting an existing screen's
  bound variables, because `search_design_system` returns nothing for this file. The core
  components are on the `🧩 Components — Core (Material)` page.
- **App-screen conventions:** 1440×900 frame, a 280px cream sidebar (`background/secondary`)
  with an orange (`primary`) logo bar and active nav item, white content, orange accent
  links, font **Inter** (Regular, Medium, Semi Bold, Bold).
- **Gotcha:** a paint returned by `setBoundVariableForPaint` can lose its variable binding
  when it is reused across many `node.fills` assignments, and the base color shows instead.
  Create a fresh bound paint per text node and set its base color to the resolved fallback,
  so the contrast is right either way.
- Check each section with `get_screenshot` as you go.

These mockups are not a published library that other files can import, so build in this
file, on the new page, to keep the tokens working.
