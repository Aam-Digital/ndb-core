# Clean code checklist

Go through every section. The example at the end shows them applied to one service.

## Levels of methods

Aim for four levels, where each level only calls the one below:

1. **Public API:** the entry points other code calls. No logic beyond guards.
2. **Flow:** one method per use case that reads as the sequence of its steps, like the
   description of the class. It decides, the steps do the work.
3. **Steps:** one job each. A step handles its own failure (log, alert, analytics) and
   returns whether it succeeded, so that the flow stays a list of `if (!step()) return`.
4. **Helpers:** small and without flow logic (a storage key, a check, a log call).

From a public method to the code that does the work should be at most about four calls.
An `async` flow with `await` and `Promise.all` replaces callback chains, completion flags
and closures such as `checkBothComplete()`.

## Merge or split

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

## Names

- A method name says what the method does, for every case it runs in. A name that is only
  true for one case (`runBackgroundMigration()` for a path without background work) is
  wrong.
- Name the outcome a step checks or achieves: `userConfirmsSwitch()`, `syncLastChanges()`,
  `deleteLegacyDb()`, `legacyDbExists()`.
- A predicate (`is…`, `has…`) only answers the question. Logging or tracking why it says
  no belongs to the caller.
- Use one word per thing across the code: not "old", "legacy" and "previous" for the same
  database. User-facing text can use other words than the code.
- Prefer a short name that is clear in its context over a long one that repeats the class
  name.

## Smells

- **Flag arguments:** a boolean passed through several methods
  (`switchToNewDb(…, deleteLegacyDb)`). Compute it once in the flow and branch there.
- **Hidden order dependency:** public mutable state that one method sets and another
  reads (`migrationPending`). Return it from the first call and pass it to the second.
- **Repeated pairs:** the same two or three lines in many places (a debug log followed by
  an analytics event, a prefix and a key). Put them in one helper.
- **Repeated branches:** branches that differ only in their data. Use small factory
  functions (`legacyDbConfig()`, `newDbConfig()`) so that each branch is a few lines.
- **Defensive layers** that check the same thing twice, or a `try`/`catch` around a call
  that cannot throw. Optional chaining and one fallback are usually enough.

## Comments

- Keep comments that say **why**: a risk (data loss), a library quirk, a magic number, an
  order that matters, a case that looks wrong but is intended.
- Remove comments that say **what** the code or the name already says: `@param` lines
  that repeat the parameter name, a numbered list of the branches below it, "Download all
  data" on `downloadIntoNewDb()`.
- Shorten a class comment that retells the whole flow, once the flow method shows it. Keep
  the facts the code cannot show.
- A comment that has to explain what a block does is a hint for a method with that name.
- Do not add comments about the refactoring itself ("simplified", "was moved from").

## Tests

- Behaviour stays the same, so the existing tests should pass with few changes. A test
  that breaks without a public API change usually relied on a private method: drive it
  through the public API instead.
- Remove the tests of removed code, and the mocks and constants only they used.
- Merge tests of the same shape into an `it.each` table, and split a table whose rows
  need a different assertion each (see `.github/instructions/unit-tests.instructions.md`).

## Example

`IndexeddbMigrationService` (the PouchDB adapter migration in `src/app/core/database/`,
refactored in Aam-Digital/ndb-core#4641) had 17 methods and a call depth of about eight from `runBackgroundMigration()` to the
work. A callback chain with completion flags joined a second path through a boolean
passed along three "switch" methods, and the predicate for other open tabs also logged
and tracked analytics.

After the refactoring it has 14 methods: two public ones, one flow and four steps, which
handle their own failures, plus helpers. Its main method reads as the steps:

```ts
private async migrate(session: SessionInfo, legacyDb: SyncedPouchDatabase) {
  const deleteLegacyDb = legacyDbHasNewName(session);
  const [newDbReady] = await Promise.all([
    deleteLegacyDb || this.downloadIntoNewDb(session, legacyDb),
    firstValueFrom(legacyDb.localSyncState.pipe(filter((s) => s === SyncState.COMPLETED))),
  ]);
  if (!newDbReady) return;
  if (deleteLegacyDb && this.isOpenInOtherTabs()) {
    return this.logStep("migration_skipped-multiple-tabs", "…");
  }
  if (!(await this.userConfirmsSwitch(deleteLegacyDb))) {
    return this.logStep("migration_reload-postponed", "…");
  }
  // … final sync behind a progress dialog, then delete the legacy DB if needed
  this.setMigrated(session);
  this.window?.location.reload();
}
```

The unused cleanup method was removed, and the comments were cut from 84 to 41 lines by
keeping only what the code does not say.
