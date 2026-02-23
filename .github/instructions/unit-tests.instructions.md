---
applyTo: "**/*.spec.ts"
---

# Unit Testing Patterns (Jasmine/Karma)

## Test Module Setup

Use `MockedTestingModule.withState()` as the standard unit test setup:

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
MockedTestingModule.withState(LoginState.LOGGED_IN, [testEntity1, testEntity2])
```

## TestEntity for Generic Tests

Use `TestEntity` from `src/app/utils/test-utils/TestEntity.ts` when you need a generic entity:

```typescript
import { TestEntity } from "../../utils/test-utils/TestEntity";

const entity = TestEntity.create({ name: "Test" });
const entity2 = TestEntity.create("Quick Name");
```

`TestEntity` has fields: `name`, `other`, `ref`, `refMixed`, `category`, `dateOfBirth`.

## Mocking Dependencies

Use `jasmine.createSpyObj` for service mocks:

```typescript
const mockService = jasmine.createSpyObj("EntityMapperService", [
  "load",
  "save",
  "remove",
]);
mockService.load.and.returnValue(Promise.resolve(testEntity));

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

## Custom Jasmine Matchers

These matchers are globally registered and available in all spec files:

```typescript
// Entity type checking
expect(entity).toHaveType("Child");

// Form validation
expect(form).toContainFormError("required");
expect(form).toHaveValue({ name: "Test" });
expect(form).toBeValidForm();
expect(form).toBeEnabled();

// Collection matchers
expect(map).toHaveKey("someKey");
expect(array).toBeEmpty();

// Number matchers
expect(value).toBeFinite();

// Object matchers
expect(obj).toHaveOwnProperty("name");

// Date matchers
expect(dateValue).toBeDate("2024-01-15");
```

## Async Testing Patterns

### fakeAsync / tick / flush

```typescript
it("should update after async operation", fakeAsync(() => {
  component.loadData();
  tick(); // resolve microtasks (promises)
  fixture.detectChanges();

  expect(component.data()).toBeTruthy();
  flush(); // resolve all remaining async tasks
}));
```

### expectObservable

Use `expectObservable()` from `src/app/utils/test-utils/observable-utils.ts`:

```typescript
import { expectObservable } from "../../utils/test-utils/observable-utils";

// Assert first emitted value
await expectObservable(myObservable$).first.toBeResolvedTo(expectedValue);

// Assert full sequence
await expectObservable(myObservable$).inSequence.toBeResolvedTo([val1, val2]);
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

# Run all tests
npm run test -- --watch=false
```
