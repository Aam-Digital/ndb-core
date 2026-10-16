---
name: design-prototype
description: Create a clickable UI prototype for a new feature or a change to an existing screen, built with the Aam Digital design system, so the team can discuss how it should look and behave before it is built. Use when someone says "make a prototype", "mockup this", "design this issue", "show me how this could look", "can you design this screen", or wants a visual proposal to put on a GitHub issue.
argument-hint: <issue-url, issue-number or short description of the screen/feature> (optional)
---

# Prototype a feature in the Aam Digital design system

The result is a small clickable page that looks like the real app and lets people try
the idea on made-up example data. It is meant for discussion on an issue: it should be
easy to read, easy to change after feedback, and it must not promise behavior nobody has
agreed on.

For designs that are built in Figma, use `/figma-mockups` instead. This skill is for the quick,
interactive proposal.

## Steps

1. **Understand the ask.** The ask is an issue or a description, given as the argument or
   in the request itself. If there is neither, ask which screen or feature it is for. For
   an issue, read it with its comments:

   ```
   gh issue view <n> --repo Aam-Digital/ndb-core --json number,title,body,labels,comments
   ```

   Then look at the screen or dialog that is being changed: find its template and texts
   in `src/app` so the prototype can use the real labels, fields and buttons. Start the
   app in demo mode if you need to see it.

2. **Use the design system "Aam Digital".** Start with the Artifact tool's `quickstart`
   with `intent: "design"` and pick the design system titled **Aam Digital** from the
   list it returns (<https://claude.ai/artifact/Pao3w632NxQkwzZG1ddnU6>; if you already have
   the link, pass `design_systems: false` and read it directly). Read its
   `project/README.md`, its `project/tokens.json` and the README of every component you
   use, and build only from those colors, type styles, spacing and components. If the
   system is not in the list, tell the user to ask a maintainer to share it with them, and
   do not switch silently to another design system.
3. **Build the prototype** following the conventions below, then publish it as a private
   artifact. Follow the instructions of the Design type that the quickstart points to.
   Without the Artifact tool, write one self-contained HTML file and give its path.
4. **Hand it over.** Give the link and a few lines: what the prototype shows, which
   behavior you had to assume, and the open questions. The user decides what to post on
   the issue.
5. **Iterate on feedback.** Change what was asked, keep the rest, and list what changed
   at the top. Feedback usually asks for less, so remove before you add.

## Conventions

These come from the prototypes the team reviewed and liked.

- **Show the real thing.** Reproduce the existing screen or dialog faithfully (same
  labels, fields, buttons, order) and change only what the feature changes.
- **One example, clickable.** Use a small set of made-up records (a short tree or list
  "Records in the system"), buttons that start the flow (for example "edit a value and
  save"), the screen that results, and a **Reset** button. Names and values are
  invented. Never use real people, projects or production data, the repo is public.
- **One state per step.** Show the situations people will ask about, one at a time:
  before and after, nothing to suggest, several records, a warning, "already up to date".
- **Keep it lean.** Every line of text, badge or hint has to earn its place. Prefer one
  clear visual cue (for example a green "+" on a value that is added) over a sentence, and
  put explanations behind a small help (?) or tooltip. Leave out what the issue does not
  ask for.
- **Mark assumptions.** Anything not decided in the issue goes into an **Open questions
  for the team** section at the bottom, phrased so that people can answer yes or no. A
  revision starts with **What changed after the feedback**.
- **Look right everywhere.** Light and dark theme, readable text contrast, and a layout
  that works at a narrow width. Use tokens only, no extra colors or fonts.
