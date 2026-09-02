# Unit test inventory & triage

_An audit of the Vitest unit suite: how much of it arrived this year, what makes it slow to
review, what it costs in CI, and what is worth keeping._

Every number below was measured on this checkout unless explicitly marked as an estimate.
Method and caveats are at the bottom.

---

## 1. Half the test suite was written this year

Attributing every line in `src/**/*.spec.ts` to the commit that wrote it — with `git blame -w`
and `--ignore-revs-file` covering the three mechanical refactors that rewrote existing tests
wholesale (the Vitest migration #3771 and the provider/database test cleanups #4197, #4189) —
gives the vintage of the suite as it stands today:

| Year authored | LOC in HEAD | Share | Tests | Share | Avg test-name length |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2020 and earlier | 2,209 | 3.2% | 92 | 3.4% | 30 ch |
| 2021 | 3,556 | 5.2% | 165 | 6.0% | 41 ch |
| 2022 | 4,848 | 7.1% | 233 | 8.5% | 45 ch |
| 2023 | 8,214 | 12.0% | 323 | 11.8% | 53 ch |
| 2024 | 6,887 | 10.1% | 236 | 8.6% | 48 ch |
| 2025 | 12,214 | 17.9% | 410 | 15.0% | 49 ch |
| **2026 (8 months)** | **30,263** | **44.4%** | **1,277** | **46.7%** | **62 ch** |
| **Total** | **68,191** | **100%** | **2,736** | **100%** | |

- **Write rate:** ~3,780 test LOC/month in 2026 vs ~1,018/month in 2025 — **3.7x**.
- **Median test diff per PR:** **92 LOC** in 2026-Q3, against 22–38 through all of 2023–2025.
- **PRs per quarter:** 80–97 in 2026, against 39–55 through 2025.

The per-PR figure is the one that matches the felt experience. A reviewer in 2025 opened a
typical PR and found ~30 lines of test changes; in the last quarter the median is 92, and
there are roughly twice as many PRs. Review load from tests alone is up four- to five-fold.

### Reviewer burden per pull request

| Quarter | PRs touching tests | Median +test LOC | Largest +test LOC | test : source |
| --- | ---: | ---: | ---: | ---: |
| 2024-Q3 | 40 | 35 | 1,187 | 0.63x |
| 2025-Q1 | 43 | 29 | 1,223 | 0.50x |
| 2025-Q2 | 40 | 22 | 539 | 0.42x |
| 2025-Q3 | 55 | 38 | 626 | 0.34x |
| 2025-Q4 | 39 | 22 | 834 | 0.45x |
| 2026-Q1 | 84 | 52 | 11,660 | 1.91x |
| 2026-Q2 | 97 | 63 | 1,564 | 0.60x |
| **2026-Q3** | **80** | **92** | **1,569** | **0.88x** |

The 11,660-line outlier in Q1 is the Vitest migration — mechanical, and reviewable as such.
The 1,569-line entry in Q3 is not: `feat(admin): structured UI to manage user role
permissions` (#4160) added 1,569 lines of new tests across 11 files alongside ~2,200 lines of
implementation — a single PR carrying more test code than the whole of 2024-Q4.

---

## 2. What actually makes the new tests hard to read

The honest finding first, because it changes the remedy: **the recent tests are not badly
written.** Read `system-reset.service.spec.ts` — every name states a real invariant with the
reason attached: _"should keep database indices, because the app keeps running without a
reload"_, _"should refuse to delete records while offline, to avoid conflicts with other
users"_. That is better than most of what preceded it.

The problem is that the tests are **exhaustive where they could be selective, and enumerated
where they could be tabulated** — plus four specific habits that make a diff slow to verify.

### Style drift, per 100 lines of test code by year authored

| Year | `as any` casts | `toHaveBeenCalled` | Names > 80 chars | Near-duplicate name pairs |
| --- | ---: | ---: | ---: | ---: |
| 2022 | 0.25 | 2.08 | 6% | 19 |
| 2023 | 0.30 | 1.68 | 11% | 22 |
| 2024 | 0.18 | 1.61 | 8% | 25 |
| 2025 | 0.58 | 1.03 | 10% | 43 |
| **2026** | **1.01** | **1.77** | **16%** | **114** |

### a. Enumeration where a table belongs

`query.service.spec.ts` (797 lines, 647 from 2026) tests the report helper functions one
`describe` per helper, one `it` per edge case. Eleven of those tests are the identical
three-line shape — call `queryData(expr, null, null, input)`, assert the result — differing
only in their inputs. That is a lookup table written out longhand:

```typescript
// as written — 80 lines for 11 cases
describe(":sum", () => {
  it("should sum numeric values in array", () => {
    const data = [1, 2, 3, 4];
    const result = service.queryData(":sum", null, null, data);

    expect(result).toBe(10);
  });

  it("should handle string representations of numbers", () => {
    const data = ["1", "2", "3"];
    const result = service.queryData(":sum", null, null, data);

    expect(result).toBe(6);
  });
  // ... 9 more of exactly this shape, across :count, :sum and :avg
});
```

```typescript
// as a table — ~15 lines, same coverage
it.each([
  [":count",  [1, 2, 3, 4, 5],        5],
  [":count",  [],                     0],
  [":sum",    [1, 2, 3, 4],          10],
  [":sum",    ["1", "2", "3"],        6],
  [":sum",    ["1", "x", "3", null],  4],
  [":sum",    [],                     0],
  [":avg",    [10, 20, 30],        "20"],
  [":avg",    ["10", "x", "30"],   "20"],
  [":avg",    [],                   "0"],
  [":avg(2)", [10, 20, 25],     "18.33"],
])("%s over %j -> %s", (expr, data, expected) => {
  expect(service.queryData(expr, null, null, data)).toBe(expected);
});
```

The table version is not just shorter, it is **reviewable**: the whole contract sits on one
screen, and the reviewer can see at a glance that `:count` has no non-numeric case while
`:sum` and `:avg` do. In the longhand version that asymmetry is invisible without reading all
eighty lines.

**731 tests — 27% of the suite, 3,685 lines — are single-assertion tests with five or fewer
statements**, i.e. table rows written out individually. The repo uses `it.each` exactly three
times, all in the newest PR.

### b. Near-identical tests that differ in one token

`paginated-data-source.spec.ts` (537 lines, entirely 2026) contains three consecutive tests
named _"should empty filteredRecords, move the paginator back to page 0, and refetch from
scratch when the **filter** changes / ... when the **sort order** changes / ... when an
**entity update** is received"_. Their bodies are 24 lines each and structurally identical;
only the trigger and the expected query argument differ. Seventy-two lines in which a
reviewer must diff three blocks against each other by eye.

Across the suite there are **243 pairs of tests in the same file whose names are >=80%
identical; 114 of those pairs (47%) were written in 2026**, against 43 in 2025.

### c. Reaching through the public API

The same file drives its subject with `(dataSource as any).updateSort("name", "asc")` and
`(dataSource as any).processEntityUpdate()`. `as any` casts now appear at **1.01 per 100
lines of test code, four times the 2022–2024 rate**. Each one is a test that will keep passing
after the private method it calls has been renamed, and a reviewer who cannot tell from the
diff whether the behaviour under test is reachable by a real caller at all.

### d. Asserting on framework internals

`permission-matrix.component.spec.ts` — 474 lines, the largest single test file added this
year — asserts on Angular Material's private class names: `mat-mdc-checkbox-checked`,
`mat-mdc-checkbox-disabled`, `tr[mat-row]`. Twenty-five such lines exist in the suite and
**all of them were written in 2026**; the pattern did not exist before. They break on Material
upgrades and tell a reviewer nothing about what the user sees.

> None of these four habits is a correctness problem. All four are **review** problems: they
> inflate a diff without adding information, and they push the reader from _"does this assert
> the right thing?"_ to _"are these three blocks actually different?"_ — a much slower question.

---

## 3. Nothing tells anyone when to stop

Three project documents instruct that tests be written. **None says how many, how long, or in
what style.**

- `AGENTS.md` — _"Write unit tests for all new components and services."_
- `doc/compodoc_sources/how-to-guides/write-unit-tests.md` — opens with _"We are trying to
  cover all functionality with unit tests."_
- `.github/instructions/unit-tests.instructions.md` — 170 lines of patterns for _setup_,
  _mocking_, _assertions_, _async_ and _file structure_. Nothing on volume, on parameterising
  repeated cases, or on naming. Its canonical example — the first thing anyone copies —
  asserts `expect(component).toBeTruthy()`.

The contrast with the e2e guidance in the same `AGENTS.md` is exact, and it is the fix already
written down elsewhere in this repo:

```
e2e  ->  "Keep the number of stand-alone e2e tests to a minimum: the initial
          loadApp() is expensive, so prefer integrating a new check as an
          additional step into an existing scenario."

unit ->  "Write unit tests for all new components and services."
```

One of those tells a contributor — human or agent — where the ceiling is and what to do
instead. The other is an open-ended instruction to keep going, handed to a tool that is very
good at keeping going. The behaviour being complained about is the documented convention
working exactly as written.

> **This is the highest-leverage change in this document.** Everything else here is cleanup of
> what already landed; this is the only item that changes what lands next month.

---

## 4. The same growth is what made CI slow

Vitest's own end-of-run breakdown, full suite, workers capped at 4:

```
Test Files  467 passed | 2 skipped (469)
     Tests  2793 passed | 21 skipped (2814)
  Duration  83.16s  (transform 151.68s, setup 82.75s, import 48.55s,
            tests 191.99s, environment 325.85s)
```

Those inner figures are worker-CPU seconds and sum to ~801. Only **192 of them (24%) are
test bodies**. The largest single line item, at 41%, is `environment` — standing up a fresh
jsdom for a spec file. **That cost is charged per file** and is almost independent of what
the file contains.

Running the exact CI command instead (`npm run test-ci`, coverage on, cold Angular cache,
4-core box — the same core count as a GitHub-hosted runner) shifts the proportions but not
the conclusion:

```
$ time npm run test-ci        # total wall 198s, of which vitest:
  Duration  170.88s (transform 100.21s, setup 90.62s, import 40.73s,
            tests 235.19s, environment 270.25s)
```

Coverage instrumentation makes test bodies more expensive, so their share rises from 24% to
32% — and jsdom setup is *still* the largest line at 37%. Under either configuration
**roughly two thirds of the work is not running tests**. Only ~27 of those 198 seconds were
the Angular build; the rest is the suite itself.

Divide the four non-test phases across 469 files and you get a fixed toll of about
**1.30 seconds of CPU per spec file**, paid before a single assertion runs. The average
file's assertions take 0.41s.

> **Consequence:** CI time tracks the **number of spec files** far more closely than the
> number of tests. Splitting tests across more files makes the suite slower; consolidating
> them makes it faster. Triage should go after whole files, not individual assertions.

---

## 5. The cheapest deletion available: 104 smoke-only files

There are **401** assertions of the form `should create` / `should be created` — 14% of all
tests; 252 are literally `expect(component).toBeTruthy()`. That alone is a readability
problem. The speed problem is where they live: **104 spec files — 22% of the unit suite —
contain nothing else.** Between them they hold 107 assertions.

| Kind | Files | Example |
| --- | ---: | --- |
| Dialogs, buttons, panels | 47 | `core/common-components/pill/pill.component.spec.ts` |
| Admin config UI | 24 | `features/matching-entities/admin-matching-entities/…` |
| `edit-*` field editors | 10 | `core/basic-datatypes/string/edit-text/…` |
| `display-*` renderers | 10 | `core/basic-datatypes/string/display-text/…` |
| Dashboard widget settings | 8 | `features/dashboard-widgets/birthday-dashboard-settings…` |
| Services | 4 | `core/admin/json-editor/json-editor.service.spec.ts` |
| Directives | 1 | `core/common-components/border-highlight/…` |
| **Total** | **104** | 22% of files, 3.8% of tests, 3,655 LOC |

### What they cost

Run on their own: **27.01s wall / 298s worker-CPU** for 107 assertions. The honest number is
the marginal one — the same suite with and without them, everything else held constant:

| Run | Files | Tests | Wall | Worker-CPU |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 469 | 2,814 | 83.16s | 800.8s |
| Smoke-only files excluded | 365 | 2,707 | 75.02s | 607.9s |
| **Delta** | **−104** | **−107** | **−9.8%** | **−24.1%** |

Deleting 22% of the spec files removes 3.8% of the tests and buys 10% of wall time on a
4-worker machine, or 24% of the CPU. On CI — coverage on, more CPU-bound — the real saving
sits nearer the upper figure.

### The worst of them

Cost per assertion, including the per-file toll:

| Spec file | Tests | LOC | s/test |
| --- | ---: | ---: | ---: |
| `features/matching-entities/admin-matching-entities/admin-matching-entities.component.spec.ts` | 1 | 112 | 1.77 |
| `core/admin/json-editor/edit-json/edit-json.component.spec.ts` | 1 | 31 | 1.67 |
| `core/admin/admin-entity/admin-entity-general-settings/…spec.ts` | 1 | 71 | 1.64 |
| `core/user/profile/profile.component.spec.ts` | 1 | 52 | 1.57 |
| `core/form-dialog/row-details/row-details.component.spec.ts` | 1 | 66 | 1.50 |

`admin-matching-entities.component.spec.ts` is the clearest case: 112 lines building five
hand-rolled mocks (`ConfigService`, `EntityRelationsService`, `EntityFormService`,
`EntityRegistry`, a `BehaviorSubject` of config) in order to assert
`expect(component).toBeTruthy()`. Every mock is a hostage to future refactors; none is
checked against the real service's shape.

Fifteen of the 104 go further and import `MockedTestingModule.withState()`, which imports
the entire `AppModule` — every feature module, `RouterModule.forRoot(allRoutes)`,
`ServiceWorkerModule`, AngularFire, Angulartics — to reach that one-line assertion.

---

## 6. Why the 104 smoke files exist, and why they will regrow

Every new component gets a spec file, and every spec file is born as a smoke test, because
that is what the canonical template in `.github/instructions/unit-tests.instructions.md`
shows. Some grow real assertions later; 104 never did. **Deleting the 104 without changing
the template just schedules them to regrow** — see section 3.

Credit where due: `AGENTS.md` already contains the right instinct a paragraph after the
instruction that causes this — _"Do not add unit tests for trivial changes... A test that only
pins down exact wording breaks on the next copy edit and adds no protection against real
regressions."_ That reasoning needs extending from trivial _changes_ to trivial _components_,
and pairing with a volume ceiling.

---

## 7. On the e2e hypothesis: mostly wrong, and that is the good news

The premise was that Playwright coverage might make component UI unit tests redundant. It
largely does not, because this suite is not really testing UI.

| | |
| --- | ---: |
| Component specs | 273 |
| …that assert on rendered DOM (`nativeElement` / `By.css` / `querySelector`) | **22 (8%)** |
| …that touch neither DOM nor interaction — pure class logic via TestBed | **162 (59%)** |

Only 22 component specs make an assertion about rendered markup. The majority instantiate a
component purely to reach its class logic — sorting rules, config mapping, form state — then
assert on the instance. There is very little UI-rendering coverage to hand over to
Playwright, because very little was ever written.

Where component specs are substantial they are **complementary, not duplicative**:

- `public-form.component.spec.ts` holds 17 tests covering config migration from two legacy
  formats, permission-denied submission, prefilled fields promoted to hidden fields, and
  re-submit deduplication. The e2e walks one happy path.
- `entities-table.component.spec.ts` holds 18 tests on sort / filter / shift-select
  semantics; the e2e checks selection survives one sort.
- `matching-entities.component.spec.ts` holds 18 tests against a single widget scenario.

> The overlap with e2e is real but **narrow, and it sits exactly on the smoke tests**:
> "this component can be constructed with its real providers" is precisely what e2e proves,
> for keeps, on every screen it visits. For behaviour tests there is no meaningful overlap
> to reclaim.

The comparison does raise a separate point in e2e's favour: 42 scenarios in 5m08s
*including a full application build* is better value per scenario than the unit suite, and
it exercises the wiring unit tests deliberately mock away. If test budget moves anywhere it
should move toward e2e — not toward more component specs.

---

## 8. What is genuinely valuable — leave it alone

A pruning exercise is only credible if it says what not to touch. Several of these are 2026
work, and among the best-designed tests in the repo.

| Cluster | Tests | Why it earns its place |
| --- | ---: | --- |
| `system-reset.service` | 17 | Every name states an invariant with its reason, on a feature that deletes all of a customer's data. Exactly what unit tests are for. |
| `config.service` + `config-migrations` | 34 + … | 24 of them pin individual config migrations, which run against documents written by real deployments. A regression is silent and unrecoverable. Pure functions, near-zero cost. |
| `logging.service` | 38 | Sentry fingerprinting, repeat-capping, network-error bucketing. Invisible to e2e, subtle enough that nobody would notice it breaking until an incident. |
| `entities-table`, `entity-list`, `paginated-data-source` | 51 | Combinatorial sort / filter / selection / pagination semantics. e2e can afford one path through the matrix; these cover the corners. |
| `query`, `data-aggregation`, `download`, `data-transformation` | ~80 | Data transformation with many input shapes — csv escaping, enum labels, date formats, referenced entities. Textbook unit-test territory. |
| `*.datatype.spec.ts` | 140 | 17 files, 140 tests, **2.3s total** via a shared `testDatatype()` harness. The best cost-to-coverage ratio in the codebase and the model the rest should follow. |

### Smaller things that are simply wrong

- **`de-duplication-module.spec.ts`** opens by asserting that a route's `path`, `component`
  and `data` equal the values written literally in the module three lines away. A tautology:
  it can only fail when someone edits the module, which is the same moment they would edit
  the test.
- **7 tests are already disabled** via `it.skip` / `describe.skip` — the whole of
  `performance-tests.spec.ts` and `edit-recurring-interval.component.spec.ts` plus five
  singles. Still transformed, still read, protecting nothing.
- **24% of all spec LOC (16,439 lines) is scaffolding** — import blocks and `beforeEach`
  bodies — before any assertion. `EntityRegistry` is re-provided in 66 files,
  `EntityMapperService` in 49, `MatDialog`/`MatDialogRef` in 67. This is the "overwhelming to
  review" complaint in one number.
- **A fully passing run still prints 276 stderr blocks**, including 46 jsdom
  _"Not implemented: Window's alert()"_ warnings and dozens of deliberately-provoked
  `ConfigLoadError` stack traces that nothing silences. Green output that looks like a
  failure trains people to stop reading it.

---

## 9. Recommendations

Ordered so that the thing which stops the growth comes first. Items 1–3 address review
burden; 4–7 address runtime. They do not conflict — consolidating tests into fewer, denser
files makes the suite both shorter to read and faster to run.

1. **Give unit tests the ceiling e2e already has.** _(highest leverage)_
   Add to `AGENTS.md` and `.github/instructions/unit-tests.instructions.md` the three things
   the e2e guidance has and the unit guidance lacks: a **ceiling** (tests follow behaviour,
   not files — a component with no branching logic needs no spec), a **reason** (every spec
   file costs ~1.3s of CI and a reviewer's attention), and the **preferred alternative** (add
   a case to an existing spec rather than a new file). Change the canonical example so its
   assertion is a behaviour, not `toBeTruthy()`. Soften the opening line of
   `write-unit-tests.md`.
   _Effort: ~3 paragraphs. This is the only item that changes what lands next month._

2. **Make `it.each` the house style for repeated shapes.**
   Document the rule: _three or more tests sharing a body shape become one `it.each` table._
   The repo already proves the pattern works — `testDatatype()` covers 140 tests in 17 tiny
   files. Retrofit the obvious cases first (`query.service`, `paginated-data-source`,
   `color-input`) as a demonstration commit.
   _Available: 731 tests / 3,685 LOC are single-assertion table rows; 114 near-duplicate name
   pairs from 2026._

3. **Three review rules, stated once.**
   - Name the invariant, not the scenario — if a test name needs "and", it is two tests or
     one table. _(16% of 2026 names exceed 80 characters.)_
   - Drive the subject through its public API — no `(x as any).privateMethod()`.
     _(`as any` is at 4x the historical rate.)_
   - Assert what the user sees — roles and visible text, never `mat-mdc-*` class names.
     _(25 such assertions, all from 2026.)_

   Each is mechanically checkable with a lint rule later if it does not stick on its own.

4. **Replace the 104 smoke-only files with one registry sweep.**
   Delete all 104; add a single spec that walks `componentRegistry` and instantiates every
   registered component against the real provider set. Keeps the only thing they bought — a
   DI-wiring and template-compilation check — and pays the per-file toll once instead of 104
   times. One commit, separate from anything else, per the repo's refactoring rule.
   _Measured: −9.8% wall, −24.1% worker-CPU, −3,655 LOC, −22% of files in review._

5. **Stop importing `AppModule` into unit tests.**
   `MockedTestingModule` pulls in the entire application module and 80 spec files import it.
   `CoreTestingModule` already shows the lean alternative, and #4197 already did this for the
   service specs — finish the job for components.
   _Estimate: the largest single contributor to the 151.7s transform + 82.8s setup._

6. **Run non-DOM specs under the node environment.**
   59 spec files never use `TestBed` and never touch `document`, `window` or `localStorage`.
   At ~0.69s of jsdom setup per file, an `environmentMatchGlobs` rule (or a one-line
   `// @vitest-environment node` docblock) reclaims ~40s of worker-CPU for no behavioural
   change.
   _Estimate: ~40s worker-CPU. Risk: low — failures would be immediate and obvious._

7. **Housekeeping.**
   Raise `timeout-minutes` past the observed 10m23s, or shard the job. Drop the 294 redundant
   `should create` tests inside otherwise-useful files. Fix or delete the 7 skipped tests.
   Silence the deliberately-provoked error logs so a green run looks green.

The suite's problem is not that it tests too much of the wrong thing — the logic coverage is
largely sound and some of the newest work is the best in the repo. The problem is that **a
year's worth of well-intentioned, exhaustively-enumerated tests arrived faster than anyone
could establish a house style for them**, and nothing in the project's written guidance said
where to stop. Item 1 is the one that matters; the rest is cleanup.

---

## Method

Full local runs of `ng test --watch=false` and of `npm run test-ci` on this checkout, on a
4-core / 15 GB Linux box (the same core count as a GitHub-hosted runner), `TZ=Europe/Berlin`;
2,814 tests, 0 failures in every run. Vintage figures come from `git blame -w` on all 472 spec
files with `--ignore-revs-file` covering the Vitest migration (#3771) and the two
provider/database test refactors (#4197, #4189), so mechanically rewritten lines are
attributed to their original author rather than to 2026. Per-PR figures are per squashed merge
commit on `master`. Per-file timings from Vitest's JSON reporter; phase
totals from its own end-of-run summary. The with/without comparison was produced by excluding
the 104 files via config and re-running the full suite, everything else unchanged. CI figures
are from the most recent green `Pull Request - Update` run on `Aam-Digital/ndb-core`.

**Caveats.** 2026 covers eight months, so its monthly rate is comparable but its annual total
is not yet complete. "Agent authorship" is not directly attributable: merges are squashed under
human names, so the vintage analysis measures _when_ code was written, not _by what_. Absolute
wall-clock does not transfer: the same `npm run test-ci` that takes
10m23s on the CI runner took 198s here on the same number of cores, so treat local figures as
proportions, not predictions. Wall-clock deltas also depend on worker count; the worker-CPU
deltas are the more portable figure. The 1.30s per-file overhead is an average — files
importing `AppModule` sit well above it, small pure-logic files well below. Effort and saving
figures in items 5 and 6 are marked as estimates; every other number here was measured.
