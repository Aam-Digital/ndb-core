---
name: plan-implementation
description: Write the implementation plan for a GitHub issue once its objective is agreed, as one self-contained comment (Context, Decisions, Changes, Open questions) that a developer or an AI agent can implement from. Use when someone says "plan this issue", "write the implementation plan", "how should we build this", "break this down into tasks", or "what needs to change for issue 1234".
argument-hint: <issue-url or issue-number> (optional)
---

# Plan the implementation of an issue

The issue description says **what** and **why** for reviewers. The plan says **how** for
whoever implements it. It is **one comment** on the issue that is complete on its own:
someone who reads only that comment and the code can build the change without the rest of
the discussion. When decisions change, the comment is edited in place, not followed by new
ones.

## Steps

1. **Get the issue.** Take the number or URL from the argument or the request, or ask for
   it. Read it with its comments:

   ```
   gh issue view <n> --repo Aam-Digital/ndb-core --json number,title,body,labels,comments
   ```

   The objective has to be agreed first. If the use cases are missing or decisions are
   still open, say so and suggest `/feature-use-cases` before planning.

2. **Understand the code.** Read the module READMEs for the folders you will touch (see
   `AGENTS.md`), then the real code paths. Everything in **Context** is verified against
   the code, and whatever you could not verify is marked as an assumption.
3. **Write the plan** in the structure below.
4. **Show the draft in a fenced markdown block** and ask what to change. Post it only when
   the user asks for that, as one comment (`gh issue comment <n> --body-file <file>`), and
   link it in the issue description under "Implementation plan:".

## Structure

```markdown
## Implementation plan

### Context

The current state, verified against the code: file paths and how it behaves today.
Assumptions that were not verified are marked as such.

### Decisions

Each decision with its reason and the alternative that was rejected, including how the
risks are handled.

### Changes

Concrete steps: files, config keys, snippets where precision matters. Then the tests and
documentation to add or change.

### Open questions

What is still undecided and how it gets settled. Leave out when there are none.
```

## What to check for every plan

Think about these and add a step to **Changes** where they apply:

- **Clean Code:** Generic modules that are reusable.
  Avoid code duplication and consider generalizing existing logic to reuse.
- **Permissions:** who may see or do this, and how the existing permission checks apply.
- **Offline and sync:** the app works offline; consider records changed on two devices.
- **Config:** whether the config format changes and existing configs need a migration.
- **New entity types:** demo data for them.
- **Tests:** unit tests for logic that can be wrong, and an e2e step only for larger user
  flows (extend an existing scenario instead of adding a new one).
- **Docs:** the README of the module is updated in the same PR.
- **Other repos:** if the feature needs backend changes (`aam-services`,
  `replication-backend`), list them per repository in **Changes** and link the issues.

Keep the plan high-level and as short as possible. Do not include what is already obvious or implementation step details.
