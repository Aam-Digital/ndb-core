# Clean code checklist

Go through every section. The example at the end shows them applied to one service.

The rules come from "Clean Code" (Robert C. Martin), "Refactoring" (Martin Fowler) and
"A Philosophy of Software Design" (John Ousterhout). Where they disagree, as on how small a
method should be, readability for the next developer decides, not a number.

## Levels of methods

Each method stays on one level of abstraction: it either decides the order of the steps or
does the work of one step, not both. Add levels only as far as the code needs them:

- **Two levels are enough for most classes:** public methods that hold their guards and
  their flow, and below them the steps and helpers that do the work. Guards and flow read
  better in one method, separated by blank lines, than spread over several.
- **A separate flow level** pays off only for a complex class: several use cases, a long
  flow, or a flow that runs in the background with its own error handling. Then the public
  method only guards and starts the flow.

Below the public methods and the flow:

- A **step** does one job and handles its own failure (log, alert, analytics). If the flow
  has to stop when it fails, it returns whether it succeeded, so that the flow stays a list
  of `if (!(await step())) return`.
- A **helper** is small and without flow logic (a storage key, a check, a log call).

From a public method to the code that does the work should be only a few calls (about
three). `async`/`await` replaces callback chains, completion flags and closures such as
`checkBothComplete()`.

## Merge or split

A method is worth its name only if it hides more than it costs the reader to look it up.
A chain of tiny methods that each pass a call on makes the reader jump around without
hiding anything.

- **Merge** methods that only exist to pass a call on, or that do parts of one step
  between them (`switch()` → `confirmAndSwitch()` → `prepareSwitch()`).
- **Merge** a helper into its only caller when it is short and its name adds nothing.
- **Split** a method whose one-sentence description needs "and", or that mixes levels
  (a flow that also opens connections and classifies errors).
- **Do not split** for the sake of it: a step of 30 lines that does one job (for example a
  download and the handling of its failure) is fine. A wrapper used once (for example a
  progress dialog around a few lines) is not worth a method.
- **Remove** unused code ("currently not called") instead of keeping it in shape. Git
  keeps it.
- **Keep** a method that only exists as a test seam (for example one that creates a real
  database), and say so in its comment.

## Duplication

- **Within the scope:** blocks that repeat, branches that differ only in their data, and
  pairs of lines that always come together (a debug log followed by an analytics event, a
  prefix and a key). Check across all files changed on the branch, not only within one.
- **Against existing code:** search for code that already does the same: `src/app/utils/`,
  the shared services in `src/app/core/` and the components in `core/common-components/`.
  Search by what the code does (the API it calls, the key it builds, the datatype it
  formats), not only by its name, because a duplicate often has another name.
- **Reuse** an existing helper instead of writing a new one, and extend it if it almost
  fits.
- **Extract** shared code only when it is the same concept, usually from the third repeat
  on ("rule of three"). Two blocks that look alike by chance and may change apart can stay.
  Branches that differ only in their data become small factory functions
  (`legacyDbConfig()`, `newDbConfig()`), so that each branch is a few lines.
- Put a new helper next to its callers, and into `src/app/utils/` only when other modules
  need it.

## Names

- A method name says what the method does, for every case it runs in. A name that is only
  true for one case (`runBackgroundMigration()` for a path without background work) is
  wrong.
- Name the outcome a step checks or achieves: `userConfirmsSwitch()`, `syncLastChanges()`,
  `deleteLegacyDbs()`, `isOpenInOtherTabs()`.
- A predicate (`is…`, `has…`) only answers the question. Logging or tracking why it says
  no belongs to the caller.
- Use one word per thing across the code: not "old", "legacy" and "previous" for the same
  database. User-facing text can use other words than the code.
- Prefer a short name that is clear in its context over a long one that repeats the class
  name.

## Smells

- **Deep nesting:** nested `if`/`else` and loops make the reader keep every condition in
  mind. Handle the special cases first with guard clauses that return early, so that the
  main path stays at the first level.
- **Flag arguments:** a boolean passed through several methods
  (`switchToNewDb(…, deleteLegacyDb)`). Compute it once in the flow and branch there.
- **Several booleans for one state** (`isLoading`, `hasError`, `isDone`) that allow
  combinations that cannot happen. Use one union type (`"loading" | "error" | "done"`).
- **Hidden order dependency:** public mutable state that one method sets and another
  reads. Return it from the first call and pass it to the second (`resolveDbConfig()`
  returns `migrationPending`, which `startMigrationIfPending()` receives).
- **Magic values:** a number or string whose meaning is not obvious. Give it a named
  constant (`MIN_INDEXEDDB_ADAPTER_VERSION`).
- **Defensive layers** that check the same thing twice, or a `try`/`catch` around a call
  that cannot throw. Optional chaining and one fallback are usually enough.

## Comments

- Keep comments that say **why**: a risk (data loss), a library quirk, the reason for a
  magic value, an order that matters, a case that looks wrong but is intended.
- Remove comments that say **what** the code or the name already says: `@param` lines
  that repeat the parameter name, a numbered list of the branches below it, "Download all
  data" on `downloadIntoNewDb()`.
- Shorten a class comment that retells the whole flow, once the flow method shows it. Keep
  the facts the code cannot show.
- A comment that has to explain what a block does is a hint for a method with that name.
- Do not add comments about the refactoring itself ("simplified", "was moved from").
  Comments only refer to the current state of the code.

## Tests

- Behaviour stays the same, so the existing tests should pass with few changes. A test
  that breaks without a public API change usually relied on a private method: drive it
  through the public API instead.
- Remove the tests of removed code, and the mocks and constants only they used.
- Merge tests of the same shape into an `it.each` table, and split a table whose rows
  need a different assertion each (see `.github/instructions/unit-tests.instructions.md`).

## When not to refactor

- Code that is about to be replaced or removed.
- Code whose behaviour the tests do not cover: propose tests first, or leave it.
- Only to improve a number (methods, lines, a complexity score). A refactoring is worth it
  only when the code becomes easier to understand.
- To change a style that is consistent across the module, only because another one is
  possible.

## Example

`IndexeddbMigrationService` (the PouchDB adapter migration in `src/app/core/database/`,
reworked in Aam-Digital/ndb-core#4641) had 17 methods and a call depth of about eight from
`runBackgroundMigration()` to the work. A callback chain with completion flags joined a
second path through a boolean passed along three "switch" methods, and the predicate for
other open tabs also logged and tracked analytics.

Afterwards the public `startMigrationIfPending()` only guards and starts the flow
`migrate()`, because the migration runs in the background with its own error handling.
The flow reads as its steps, with guards and steps separated by blank lines:

```ts
private async migrate(session: SessionInfo, legacyDb: SyncedPouchDatabase) {
  await firstValueFrom(
    legacyDb.localSyncState.pipe(filter((state) => state === SyncState.COMPLETED)),
  );

  if (this.isOpenInOtherTabs()) {
    return this.logStep("migration_skipped-multiple-tabs", "…");
  }
  if (!(await this.userConfirmsSwitch())) {
    return this.logStep("migration_reload-postponed", "…");
  }

  // … behind a progress dialog that cannot be closed:
  if (!(await this.syncLastChanges(legacyDb))) {
    return;
  }
  if (!(await this.deleteLegacyDbs(session, legacyDb))) {
    return this.window?.location.reload();
  }

  this.setMigrated(session);
  this.window?.location.reload();
}
```

The steps handle their own failures and return whether they succeeded, the predicate
`isOpenInOtherTabs()` leaves logging to the caller, and the unused cleanup method was
removed. The comments were cut from 83 to 35 lines by keeping only what the code does
not say.
