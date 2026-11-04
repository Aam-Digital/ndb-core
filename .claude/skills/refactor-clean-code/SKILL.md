---
name: refactor-clean-code
description: Simplify existing code for readability with "Clean Code" practices, without changing its behaviour. Analyses first and proposes the changes, refactors only after confirmation. Use when someone says "simplify this service", "this has too many methods", "refactor this for readability", "can we generalize this", "is this duplicated somewhere", "do a clean code review", "are the names clear", or "shorten the comments". Works on a file or class, or on the files changed on the current branch.
argument-hint: <file or class> (optional, defaults to the files changed on the current branch)
---

# Refactor for readability

Makes code read like a description of what it does: a short flow of steps with clear names,
each step doing one thing, and no code that already exists elsewhere. The behaviour stays the
same. The rules are in [checklist.md](checklist.md).

## Steps

1. **Find the scope.** Take the file or class from the argument or the request. Without one,
   use the files changed on the current branch (`git diff --stat origin/master...HEAD`) and
   ask which of them to look at if there are many. Read the module's README and the code
   that calls the scope, so that you know its public API.
2. **Analyse, do not edit yet.** Measure what makes the code hard to read:
   - lines, comment lines, and the number of methods;
   - the call depth from each public method down to the code that does the work;
   - for each method, what it does in one sentence. A method whose sentence needs "and",
     or whose sentence is the same as another's, is a candidate to split or merge.

   Then go through every section of [checklist.md](checklist.md).

   For a large scope, or the search for duplicates across the codebase, delegate the
   read-only search to a sub-agent on a smaller model (the `Explore` agent with Sonnet) and
   ask it only for the locations it found. Judge the findings and write the proposal
   yourself.

3. **Propose** in the format below and ask which parts to do. Code that is new on this
   branch can be refactored in this PR. Refactoring existing code goes into its own PR (see
   `AGENTS.md`), unless the user decides otherwise. Do not refactor before the answer.
4. **Refactor** what was confirmed, one commit per conceptual change (for example "remove
   the flag argument", "merge the restore methods"), separate from behaviour changes, so
   that a reviewer can tell them apart. A single commit is fine for a small refactoring.
   Keep the tests green after each commit (see "Tests" in the checklist).
5. **Verify and report.** Run `npm run lint` and the tests of the module. Report the
   numbers before and after (lines, comment lines, methods, call depth). If they missed
   your estimate, say so and why. Name what you kept on purpose (for example a method that
   exists only as a test seam) and why.

## Proposal format

```markdown
## Where the complexity comes from

- <cause, with the methods it is in> - one bullet each

## Proposed structure

- **Public methods:** <methods> - entry points with their guards (and the flow, unless it
  needs its own level)
- **Flow:** <methods> - only for a complex class (see "Levels of methods")
- **Steps and helpers:** <methods> - one job each; steps handle their own failure

## Changes

- **Merge:** <methods> → <into what>, because <reason>
- **Split:** <method> → <parts>, because <reason>
- **Rename:** `<old>` → `<new>` (<what the old name hides>)
- **Reuse:** <code> → existing `<helper>` in `<file>`
- **Extract:** <repeated code in which places> → `<new helper>`
- **Remove:** <unused code>

## Behaviour changes (options)

- <change> - saves <what>, costs <what for the user>. <recommended or not>

## Estimate

- methods: <before> → <after>
- call depth: <before> → <after>
- lines: <before> → <after> (rough)
```

Leave out a section or bullet that has nothing in it. Show a short sketch of the main flow
method after the change when it helps to see the result.
