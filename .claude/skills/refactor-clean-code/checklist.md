# Clean code checklist

Based on "Clean Code" (Martin), "Refactoring" (Fowler) and "A Philosophy of Software Design"
(Ousterhout); where they disagree, readability decides. The example at the end shows the
rules applied to one service.

## Levels of methods

Each method stays on one level of abstraction: it either decides the order of the steps or
does the work of one step, not both. Add levels only as far as the code needs them:

- **Two levels are enough for most classes:** public methods that hold their guards and
  their flow, and below them the steps and helpers that do the work. Guards and flow read
  better in one method, separated by blank lines, than spread over several.
- **A separate flow level** pays off only for a complex class: several use cases, a long
  flow, or a flow that runs in the background with its own error handling. Then the public
  method only guards and starts the flow.

Below the public methods and the flow, on one level:

- A **step** does one job and handles its own failure (log, alert, analytics). If the flow
  has to stop when it fails, it returns whether it succeeded, so that the flow stays a list
  of `if (!(await step())) return`.
- A **helper** is small and without flow logic (a storage key, a check, a log call).

From a public method to the code that does the work should be only a few calls (about
three). `async`/`await` replaces callback chains, completion flags and closures such as
`checkBothComplete()`. A public method that starts a flow without awaiting it ends it with
`.catch()` (no floating promises, see `AGENTS.md`).

## Merge or split

A method is worth its name only if it hides more than it costs the reader to look it up.

- **Merge** methods that only exist to pass a call on, or that do parts of one step
  between them (`restore()` → `startRestore()` → `handleFile()`).
- **Merge** a helper into its only caller when it is short and its name adds nothing (for
  example a progress dialog around a few lines).
- **Split** a method that does two jobs (see the one-sentence test in the analysis) or
  mixes levels (a flow that also parses the file and classifies errors).
- **Do not split** for the sake of it: a step of 30 lines that does one job (for example an
  import and the handling of its failure) is fine.
- **Remove** unused code ("currently not called") instead of keeping it in shape. Git
  keeps it.
- **Keep** a method that only exists as a test seam (for example one that creates a real
  database), and say so in its comment.

## Duplication

- **Within the scope:** blocks that repeat, branches that differ only in their data, and
  pairs of lines that always come together (a debug log followed by an analytics event, a
  prefix and a key). When the scope is the branch, check across all its changed files.
- **Against existing code:** search for code that already does the same: `src/app/utils/`,
  the shared services in `src/app/core/` and the components in `core/common-components/`.
  Search by what the code does (the API it calls, the key it builds, the datatype it
  formats), not only by its name, because a duplicate often has another name.
- **Reuse** an existing helper instead of writing a new one, and extend it if it almost
  fits.
- **Extract** shared code only when it is the same concept, usually from the third repeat
  on ("rule of three"). Two blocks that look alike by chance and may change apart can stay.
  Branches that differ only in their data become small factory functions
  (`csvExportOptions()`, `jsonExportOptions()`), so that each branch is a few lines.
- Put a new helper next to its callers, and into `src/app/utils/` only when other modules
  need it.

## Names

- A method name says what the method does, for every case it runs in. A name that is only
  true for one case (`restoreFromServer()` for a method that also restores local files) is
  wrong.
- Name the outcome a step checks or achieves: `readBackup()`, `userConfirmsOverwrite()`,
  `clearDatabase()`, `databaseIsEmpty()`.
- A predicate (`is…`, `has…`) only answers the question. Logging or alerting why it says
  no belongs to the caller.
- Use one word per thing across the code: not "backup", "export" and "dump" for the same
  file. User-facing text can use other words than the code.
- Prefer a short name that is clear in its context over a long one that repeats the class
  name.

## Smells

- **Deep nesting:** nested `if`/`else` and loops make the reader keep every condition in
  mind. Handle the special cases first with guard clauses that return early, so that the
  main path stays at the first level.
- **Flag arguments:** a boolean passed through several methods
  (`applyBackup(backup, dbWasEmpty)`). Compute it once in the flow and branch there.
- **Several booleans for one state** (`isLoading`, `hasError`, `isDone`) that allow
  combinations that cannot happen. Use one union type (`"loading" | "error" | "done"`).
- **Hidden order dependency:** public mutable state that one method sets and another
  reads (`selectFile()` sets `pendingBackup`, `restore()` reads it). Return it from the
  first call and pass it to the second (`restore(file)`).
- **Magic values:** a number or string whose meaning is not obvious. Give it a named
  constant (`50` → `MAX_BACKUP_SIZE_MB`).
- **Defensive layers** that check the same thing twice, or a `try`/`catch` around a call
  that cannot throw. Optional chaining and one fallback are usually enough.

## Comments

- Keep comments that say **why**: a risk (data loss), a library quirk, the reason for a
  magic value, an order that matters, a case that looks wrong but is intended.
- Remove comments that say **what** the code or the name already says: `@param` lines
  that repeat the parameter name, a numbered list of the branches below it, "Read the
  backup file" on `readBackup()`.
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
- Follow `.github/instructions/unit-tests.instructions.md` for the tests you touch (for
  example `it.each` tables).

## When not to refactor

- Code that is about to be replaced or removed.
- Code whose behaviour the tests do not cover: propose tests first, or leave it.
- Only to improve a number (methods, lines, a complexity score). A refactoring is worth it
  only when the code becomes easier to understand.
- To change a style that is consistent across the module, only because another one is
  possible.

## Example

A `BackupRestoreService` replaces the local data with a backup file. Before, it had 12
methods and a call depth of six:

- `restore()` → `startRestore()` → `handleFile()` → `processBackup()` →
  `confirmAndApply()` → `applyBackup()`, each passing the call on;
- `selectFile()` stored the file in a public `pendingBackup` field that `restore()` read;
- a flag `dbWasEmpty` was passed through three methods;
- a `FileReader` callback set a `fileLoaded` flag that another method polled;
- the predicate `isValidBackup()` also showed an alert;
- the class comment listed all steps, and every method had `@param` lines.

Afterwards it has 7 methods and a call depth of two. The public method holds the guards
and the flow, so there is no separate flow level:

```ts
/** Replaces the data of the local database with the content of a backup file. */
@Injectable({ providedIn: "root" })
export class BackupRestoreService {
  async restore(file: File): Promise<void> {
    const backup = await this.readBackup(file);
    if (!backup) {
      return;
    }

    const replacesData = !(await this.databaseIsEmpty());
    if (replacesData && !(await this.userConfirmsOverwrite(backup))) {
      return;
    }

    // clear first: imported docs would otherwise conflict with the revisions of existing ones
    if (replacesData && !(await this.clearDatabase())) {
      return;
    }
    if (await this.importDocs(backup.docs)) {
      this.alertService.addInfo($localize`Backup restored`);
    }
  }

  // steps: readBackup(), userConfirmsOverwrite(), clearDatabase(), importDocs()
  // helpers: databaseIsEmpty(), isValidBackup()
}
```

- The steps alert and log their own failures; `readBackup()` returns `undefined` for an
  invalid file and shows the alert that `isValidBackup()` showed before.
- The flag is computed once as `replacesData`, and the file is passed to `restore()`
  instead of being kept in a field.
- Only the comment that says why remains, next to the class comment of one sentence.
- Offering a merge instead of an overwrite was proposed as a behaviour change, as an
  option with its cost, and not done in the refactoring.
