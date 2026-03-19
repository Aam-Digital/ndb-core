---
applyTo: "**/*.spec.ts"
---

# Unit Testing Patterns (Vitest)

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

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
```

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
