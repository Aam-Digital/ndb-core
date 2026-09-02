---
applyTo: "**/*.spec.ts"
---

# Unit Testing Patterns (Vitest)

## What to test, and how much

Before adding a spec file, check that it is the right shape of test:

- **Test behaviour, not existence.** Cover logic that can be wrong: branches,
  transformations, error paths, edge cases. `expect(component).toBeTruthy()` asserts only
  that Angular can construct a class — the production build and the e2e suite already
  establish that, and `src/app/component-smoke.spec.ts` sweeps every registered component
  for it in a single file. Add a component to that sweep's list instead of writing a new
  spec file whose only assertion is construction.
- **A spec file must earn its environment.** Each one costs a fresh jsdom (~1.3s of CI
  whether it holds one test or thirty) and a reviewer's attention. Prefer adding a case to
  an existing spec over creating a new file.
- **Three or more tests sharing a body shape become one `it.each` table** (see below).
- **Name the invariant, not the scenario.** If a test name needs "and", it is two tests or
  one table.
- **Drive the subject through its public API.** No `(component as any).privateMethod()`.
- **Assert what the user sees** — roles and visible text, never framework-internal class
  names such as `mat-mdc-checkbox-checked`.

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

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should do something specific", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Running Tests

```bash
# Run specific test file
npm run test -- --watch=false --include='**/my-component.spec.ts'

# Run CI-style suite with coverage
npm run test-ci

# Run all tests
npm run test -- --watch=false
```
