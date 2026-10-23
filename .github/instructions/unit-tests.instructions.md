---
applyTo: "**/*.spec.ts"
paths: "**/*.spec.ts"
---

# Unit Testing (Vitest)

Rules and patterns for unit tests. Read them before adding a spec file.

## What to test

- **Test behaviour, not existence.** Write unit tests for logic that can be wrong: branches,
  transformations, error paths, edge cases. A component or service with no branching logic
  does not need a spec: `expect(component).toBeTruthy()` asserts only that Angular can
  construct a class, which the production build and the e2e suite already establish.
  `src/app/component-smoke.spec.ts` sweeps every registered component for that in one file,
  so add a component to its list rather than creating a new spec file for it.
- **Fix a bug test-first.** For a bug fix, write the test that reproduces the bug and see it
  fail, then fix the code.
- **Do not generate "too many" tests.** A few tests that cover the branches and edge cases
  beat many near-identical ones. Do not add tests for trivial changes (rewording an error
  message, renaming a variable, adjusting a log string) unless the behavior changes: a test
  that only pins down exact wording breaks on the next copy edit and protects against nothing.
- **A spec file must earn its environment.** Every spec file costs a fresh jsdom (about 1.3s
  of CI, however many tests it holds) and a reviewer's attention. Prefer adding a case to an
  existing spec over creating a new file, the same way we prefer extending an e2e scenario
  over adding a new one.
- **Three or more tests with the same shape become one `it.each` table** (see below). Before adding tests to a spec that is already long (several hundred lines), look for existing tests to merge into a table.
- **Name the invariant, not the scenario.** `it("keeps the wildcard row editable when the default role only covers single record types")` beats a name that restates the setup. If a name needs "and", it is two tests or one table. The same goes for `describe` blocks: name the general behavior ("record linking several parents"), not the example entities of the test ("group linking several schools").
- **Drive the subject through its public API.** No `(component as any).privateMethod()`. If
  a behavior is only reachable through a private method, test it through the caller that
  reaches it.
- **Assert what the user sees.** Query by role or visible text, never by framework-internal
  class names such as `mat-mdc-checkbox-checked`, which change on Angular Material upgrades
  and say nothing about behavior.

## Test Module Setup

Prefer to mock all dependencies to have isolated unit tests.
For very complex test cases, `MockedTestingModule.withState()` can be used:

```typescript
import { MockedTestingModule } from "../../utils/mocked-testing.module";

describe("MyComponent", () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("hides the archived hint until the record is archived", () => {
    fixture.componentRef.setInput("entity", TestEntity.create({ inactive: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("archived");
  });
});
```

## Table-driven tests

When several tests differ only in their inputs and expected result, write them as one
`it.each` table. The table shows the whole contract at a glance and makes a missing case
visible; the same cases written out longhand hide it behind near-identical blocks.

```typescript
it.each([
  [":count", [1, 2, 3, 4, 5], 5],
  [":count", [], 0],
  [":sum", [1, 2, 3, 4], 10],
  [":sum", ["1", "invalid", "3", null], 4],
  [":avg", [10, 20, 30], "20"],
  [":avg(2)", [10, 20, 25], "18.33"],
])("%s over %j returns %s", (expression, data, expected) => {
  expect(service.queryData(expression, null, null, data)).toBe(expected);
});
```

For a whole family of implementations that share one contract, extract a harness instead —
see `testDatatype()` in `entity-schema.service.test-utils.ts`, which covers 140 tests across
17 tiny spec files.

You can pass initial login state and seed entities:

```typescript
MockedTestingModule.withState(LoginState.LOGGED_IN, [testEntity1, testEntity2]);
```

## TestEntity for Generic Tests

Use `TestEntity` from `src/app/utils/test-utils/TestEntity.ts` when you need a generic entity.
If a special entity type or field is required, create a new Entity class inline in the test file instead.

```typescript
import { TestEntity } from "../../utils/test-utils/TestEntity";

const entity = TestEntity.create({ name: "Test" });
const entity2 = TestEntity.create("Quick Name");
```

`TestEntity` has fields: `name`, `other`, `ref`, `refMixed`, `category`, `dateOfBirth`.

## Mocking Dependencies

Use `vi.fn` and `vi.spyOn` for service mocks:

```typescript
const mockService = {
  load: vi.fn().mockResolvedValue(testEntity),
  save: vi.fn(),
  remove: vi.fn(),
};

await TestBed.configureTestingModule({
  imports: [MyComponent, MockedTestingModule.withState()],
  providers: [{ provide: EntityMapperService, useValue: mockService }],
}).compileComponents();
```

## Shared mocks

Before hand-building a mock, check whether a shared one exists - reusing it keeps the shape
right and gives the setup a name that says what it does.

| Helper                                          | Replaces                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `mockConfirmationDialog(confirmed?)`            | `{ getConfirmation: vi.fn().mockResolvedValue(...) }`            |
| `mockMatDialog(result?)`                        | a `MatDialog` whose `open()` returns a ref closing with `result` |
| `mockMatDialogRef(result?)`                     | `MatDialogRef` for the component _inside_ a dialog               |
| `mockEntityMapperProvider(entities?)`           | providers for a seeded in-memory `EntityMapperService`           |
| `setupCustomFormControlEditComponent(...)`      | form-control wiring for `edit-*` components                      |
| `testDatatype(...)` / `testEntitySubclass(...)` | a whole spec for a datatype or entity subclass                   |

The dialog mocks live in `src/app/utils/test-utils/dialog-mocks.ts`. Take the default and
override the one `vi.fn()` the test cares about:

```typescript
const confirmationDialog = mockConfirmationDialog();
// ... { provide: ConfirmationDialogService, useValue: confirmationDialog }

it("does not delete when the user cancels", async () => {
  confirmationDialog.getConfirmation.mockResolvedValue(false);
  ...
});
```

Note the naming: the _factory_ is `mockX()`, so name the variable it produces `x` rather than
`mockX` - otherwise the local shadows the import.

## Entity Mapper Mocking

Use `mockEntityMapperProvider()` for entity-related tests:

```typescript
import { mockEntityMapperProvider } from "../../core/entity/entity-mapper/mock-entity-mapper-service";

await TestBed.configureTestingModule({
  imports: [MyComponent],
  providers: [...mockEntityMapperProvider([entity1, entity2])],
}).compileComponents();
```

## Assertions

Prefer plain Vitest assertions over project-specific helpers:

```typescript
expect(formControl.value).toEqual({ name: "Test" });
expect(formControl.hasError("required")).toBe(true);
expect(formGroup.valid).toBe(true);
expect(formGroup.enabled).toBe(true);
expect(items).toHaveLength(0);
expect(dateValue?.getTime()).toBe(new Date(2024, 0, 15).getTime());
```

## Async Testing Patterns

### async/await and timers

```typescript
it("should update after async operation", async () => {
  await component.loadData();
  fixture.detectChanges();

  expect(component.data()).toBeTruthy();
});
```

Use `vi.useFakeTimers()` and `vi.advanceTimersByTimeAsync()` when the implementation relies on timers:

```typescript
it("debounces search requests", async () => {
  vi.useFakeTimers();
  try {
    component.search("test");
    await vi.advanceTimersByTimeAsync(300);
    expect(service.load).toHaveBeenCalledWith("test");
  } finally {
    vi.useRealTimers();
  }
});
```

## Test File Structure

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { MyComponent } from "./my.component";

describe("MyComponent", () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("shows the record name after loading", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Shared state between spec files

The unit-test runner is **not** isolated: the Angular builder leaves Vitest's `isolate` at
`false`, so every spec file in a worker shares one module registry, one `environment`
singleton, one TestBed and one jsdom `localStorage`. Anything a spec mutates and does not
restore leaks into whichever file runs next, so the damage shows up in an innocent spec and
moves between runs.

- **Never stub a shared prototype.** `vi.spyOn(Storage.prototype, ...)` and similar calls
  patch an object owned by the worker process, so even `isolate: true` would not undo it.
  Inject a fake instead. For storage, provide [`LOCAL_STORAGE_TOKEN`](../../src/app/utils/di-tokens.ts)
  with [`createFakeStorage()`](../../src/app/utils/test-utils/fake-storage.ts).
- **Never mutate a shared entity schema.** Use `TestEntity` for generic entity tests. If a
  test needs custom fields, define a dedicated entity class in that test (for example
  `@DatabaseEntity("MyTest") class MyTest extends Entity {}` and then `MyTest.schema.set(...)`)
  instead of changing the schema of `TestEntity` or another shared entity.
- **Restore from a hook, not at the end of a test body**, so the restore still runs when an
  assertion fails partway through.
- **Register every entity type a spec relies on** by importing the model (the
  `@DatabaseEntity` decorator registers it). Do not depend on another spec file having
  imported it.

## Running tests

```bash
npm run test -- --watch=false --include='**/relevant-file.spec.ts'
```

To avoid running the tests again for further analysis, pipe the output to a file with
`2>&1 | tee test-results/test-output.log`. `npm run test-ci` runs the whole suite with
coverage (written to `coverage/` in lcov format).
