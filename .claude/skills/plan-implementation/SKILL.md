---
name: plan-implementation
description: Plan the high-level architectural approach to implement a functionality once its objective is agreed. This is discussed in the development team before the actual implementation and detailed step-by-step tasks are prepared. Use when someone says "plan this issue", "write the implementation plan", "how should we build this", or "what needs to change for issue 1234".
argument-hint: <issue-url or issue-number> (optional)
---

# Plan the technical approach for a functionality

The issue description says **what** and **why** for reviewers, use cases define the user-perspective and behavior. The high-level plan says **how** for
whoever implements it.
Edited to be part of the GitHub **issue description section**. When decisions change, the description is edited in place, not keeping previous versions.
Comments on the issue may be useful for discussion and documenting changed details.

## Steps

1. **Get the issue.** Take the number or URL from the argument or the request, or ask for
   it. Read it with its comments:

   ```
   gh issue view <n> --repo Aam-Digital/ndb-core --json number,title,body,labels,comments
   ```

   The objective has to be agreed first. If the use cases are missing or decisions are
   still open, say so and suggest `/feature-use-cases` before planning.

2. **Understand the code.** Search the code base for parts that may be related.
   Read the module READMEs for the folders you will touch (see `AGENTS.md`), 
   then the real code paths. Everything in **Context** is verified against
   the code, and whatever you could not verify is marked as an assumption.
3. **Write the plan** in the structure below.
   Consider alternative approaches and explain their pros and cons.
   Ask follow up questions and lead a discussion about the high-level approach.
   Do _not_ create a detailed step-by-step implementation plan or list exact files to change.
   The plan should be very high-level, to discuss foundational decisions only.
5. **Show the draft in a fenced markdown block** and ask what to change.
6. Update the GitHub issue it only when the user asks for that,    editing the description and/or as comment.

## Structure

```markdown
## Implementation plan

One paragraph summary of the overall approach and what modules are affected.

### Changes

Very high-level steps:
Which modules (and major components / services) have to be edited or created.
Refactoring that is needed.
Phases of implementation for large tasks.

This should never list the exact files to change or detailed tasks.
Keep at a very high-level overview only.

### Open questions & Decisions

What is still undecided and how it gets settled. Leave out when there are none.
Also include each decision here with its reason and the alternative that was rejected, including how the risks are handled.

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
