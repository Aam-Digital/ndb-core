See AGENTS.md for all project conventions and coding standards.

## Creating Figma mockups

When asked to design mockups, screens, or UI variants in Figma, build them in the
**Aam Digital — Design System** file so they reuse the real components and tokens.

- **File key:** ask user to provide
- **Always load the `figma-use` and `figma-generate-design` skills before any `use_figma` call.**
- **Where to build:** add a dedicated, clearly-labelled new page (e.g. `📋 <Feature> — Mockups (#<issue>)`).
  **Never edit the canonical `📄 Screens` page** — it holds the reference screens (Dashboard,
  Entity List, Entity Details). Confirm with the user before writing into this shared file.
- **Use the design system, don't hardcode.** Tokens are **local variables** in this file
  (collections: `Color / Semantic`, `Color / Status (w-levels)`, `Spacing`, `Radius`). Bind colors
  with `setBoundVariableForPaint` and spacing/radius with `setBoundVariable`. Discover IDs via
  `getLocalVariableCollectionsAsync` / by inspecting an existing screen's bound variables —
  `search_design_system` returns empty for this file. Core components live on the
  `🧩 Components — Core (Material)` page.
- **App-screen conventions:** 1440×900 frame; 280px cream sidebar (`background/secondary`) with an
  orange (`primary`) logo bar and active nav item; white content; orange accent links; font **Inter**
  (Regular / Medium / Semi Bold / Bold).
- **Gotcha:** a paint object returned by `setBoundVariableForPaint` can **lose its variable binding
  when reused across many `node.fills` assignments** (the base color shows instead). Create a fresh
  bound paint per text node and set its base color to the resolved fallback so contrast survives either way.
- Validate each section with `get_screenshot` as you go.

These mockups are not confirmed as a published/importable library, so building in a *separate* Figma
file may not be able to import the tokens by key — building in-file (on a new page) keeps full fidelity.
