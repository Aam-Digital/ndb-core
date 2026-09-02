# Unit test inventory & triage

_An audit of the Vitest unit suite: what it contains, what it costs, and what is worth keeping._

Every number below was measured on this checkout unless explicitly marked as an estimate.
Method and caveats are at the bottom.

---

## 1. The shape of the suite

507 spec files repo-wide: **472 Vitest unit specs** under `src/`, 20 CLI specs, and 15
Playwright files holding 42 e2e scenarios. The unit suite is **68,191 lines of test code**
against 86,236 lines of production TypeScript (0.79 : 1).

| | |
| --- | --- |
| Unit spec files | 472 (2,814 tests, 552 `describe` blocks) |
| Unit test code | 68,191 LOC — 24% of it scaffolding |
| CI unit job | **10m23s** (last green PR run) |
| CI e2e job | 5m08s (42 scenarios, incl. full app build) |

The unit job is the longest thing in the pipeline and it is the critical path: on the run
sampled, lint, both `tsc` passes, actionlint, the production build, the Docker image and the
deploy were all finished within two minutes while `npm run test-ci` ran for another eight
and a half.

> **Fix this regardless of anything else in this document:** `_qa-unit.yaml` declares
> `timeout-minutes: 10` for the `test-unit` job, and the `npm run test-ci` step measured
> **10m23s** on the most recent green pull-request run. The suite is already over its own
> budget and is passing on scheduling luck.

### Composition by spec type

| Category | Files | Tests | Body time | Share | LOC |
| --- | ---: | ---: | ---: | ---: | ---: |
| `*.component.spec.ts` | 273 | 1,220 | 147.8s | 77.2% | 31,678 |
| `*.service.spec.ts` | 103 | 978 | 35.0s | 18.3% | 25,366 |
| models, utils, migrations | 61 | 414 | 5.3s | 2.8% | 8,175 |
| `*.datatype.spec.ts` | 17 | 140 | 2.3s | 1.2% | 1,777 |
| pipes, directives, guards | 15 | 62 | 1.0s | 0.5% | 1,195 |
| **Total** | **469** | **2,814** | **191.4s** | **100%** | **68,191** |

Component specs are 58% of the files and 77% of the runtime while holding 43% of the tests.
Service specs are the mirror image. That gap is the whole story.

---

## 2. Three quarters of the cost is not testing

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

## 3. 104 files that only prove the constructor runs

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

## 4. This is the documented convention working as written

None of the above is carelessness. Three project documents actively produce it:

- **`AGENTS.md`** — _"Write unit tests for all new components and services."_
- **`doc/compodoc_sources/how-to-guides/write-unit-tests.md`** — opens with
  _"We are trying to cover all functionality with unit tests."_
- **`.github/instructions/unit-tests.instructions.md`** — ships the canonical spec template,
  the first thing anyone copies, whose only assertion is:

  ```typescript
  it("should create", () => {
    expect(component).toBeTruthy();
  });
  ```

Every new component gets a spec file, and every spec file is born as a smoke test. Some grow
real assertions later; 104 never did. **Deleting the 104 without changing the template just
schedules them to regrow.**

Credit where due: `AGENTS.md` already contains the right instinct a paragraph later — _"Do
not add unit tests for trivial changes… A test that only pins down exact wording breaks on
the next copy edit and adds no protection against real regressions."_ That reasoning needs
extending from trivial _changes_ to trivial _components_.

---

## 5. On the e2e hypothesis: mostly wrong, and that is the good news

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

## 6. What is genuinely valuable — leave it alone

| Cluster | Tests | Why it earns its place |
| --- | ---: | --- |
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

## 7. Recommendations, in order of value per unit of effort

1. **Replace the 104 smoke-only files with one registry sweep.**
   Delete all 104; add a single spec that walks `componentRegistry` and instantiates every
   registered component against the real provider set. That keeps the only thing the smoke
   tests actually bought — a DI-wiring and template-compilation check — and pays the per-file
   toll once instead of 104 times. One commit, separate from anything else, per the repo's
   refactoring rule.
   _Measured: −9.8% wall, −24.1% worker-CPU, −3,655 LOC, −22% of files in review._

2. **Change the template that generates them.**
   Rewrite the canonical example in `.github/instructions/unit-tests.instructions.md` so its
   assertion is a behaviour; adjust `AGENTS.md` from "for all new components and services" to
   "for all new behaviour"; soften the opening line of
   `doc/compodoc_sources/how-to-guides/write-unit-tests.md`. Add the rule that follows from
   §2: **a spec file must earn its jsdom environment.** Without this, item 1 undoes itself
   over the next year.

3. **Stop importing `AppModule` into unit tests.**
   `MockedTestingModule` pulls in the entire application module and 80 spec files import it.
   `CoreTestingModule` already demonstrates the lean alternative. Migrating the files that
   only need entity + config plumbing is the largest remaining structural lever after item 1.
   _Estimate: the largest single contributor to the 151.7s transform + 82.8s setup._

4. **Run non-DOM specs under the node environment.**
   59 spec files never use `TestBed` and never touch `document`, `window` or `localStorage` —
   migrations, model classes, pure utils. At ~0.69s of jsdom setup per file, an
   `environmentMatchGlobs` rule (or a one-line `// @vitest-environment node` docblock)
   reclaims roughly 40s of worker-CPU for no behavioural change.
   _Estimate: ~40s worker-CPU. Risk: low — failures would be immediate and obvious._

5. **Drop the 294 surviving `should create` tests** that sit inside files which do have real
   tests. They cost almost nothing to run; this is purely about review. Removing them means
   every spec file opens on an assertion that describes actual behaviour.

6. **Fix the CI job that is already over budget.** Raise `timeout-minutes` above the observed
   10m23s, or shard the run across matrix jobs. Items 1, 3 and 4 should bring it back under
   the current limit, but the limit should not be the thing that discovers a slow suite.

7. **Resolve the 7 skipped tests and silence expected-error noise.** Fix each skipped test or
   delete it — a permanently skipped test is a comment with a build cost. Then stub the call
   sites producing the 46 jsdom `alert()` warnings and mute the deliberately-provoked error
   logs, so a green run looks green.

Taken together, items 1, 3 and 4 target the ~76% of worker-CPU that is not test execution
without removing a single behavioural assertion. Items 2 and 5 address the review-fatigue
complaint directly. **Nothing here proposes cutting coverage of logic — the suite's problem
is not that it tests too much, it is that it is spread across far too many files.**

---

## Method

Full local runs of `ng test --watch=false` and of `npm run test-ci` on this checkout, on a
4-core / 15 GB Linux box (the same core count as a GitHub-hosted runner), `TZ=Europe/Berlin`;
2,814 tests, 0 failures in every run. Per-file timings from Vitest's JSON reporter; phase
totals from its own end-of-run summary. The with/without comparison was produced by excluding
the 104 files via config and re-running the full suite, everything else unchanged. CI figures
are from the most recent green `Pull Request - Update` run on `Aam-Digital/ndb-core`.

**Caveats.** Absolute wall-clock does not transfer: the same `npm run test-ci` that takes
10m23s on the CI runner took 198s here on the same number of cores, so treat local figures as
proportions, not predictions. Wall-clock deltas also depend on worker count; the worker-CPU
deltas are the more portable figure. The 1.30s per-file overhead is an average — files
importing `AppModule` sit well above it, small pure-logic files well below. Effort and saving
figures in items 3 and 4 are marked as estimates; every other number here was measured.
