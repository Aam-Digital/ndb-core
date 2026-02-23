---
applyTo: "**/*.entity.ts,**/entity/**"
---

# Entity Model Patterns

## Entity Class Definition

All entity classes extend `Entity` and use the `@DatabaseEntity` decorator:

```typescript
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";

@DatabaseEntity("Child")
export class Child extends Entity {
  static override ENTITY_TYPE = "Child";
  static override label = "Child";
  static override labelPlural = "Children";
  static override icon: IconName = "child";
  static override route = "child";
  static override toStringAttributes = ["name"];

  @DatabaseField({ label: "Name" })
  name: string;

  @DatabaseField({
    label: "Date of Birth",
    dataType: "date-with-age",
  })
  dateOfBirth: DateWithAge;

  @DatabaseField({
    label: "Gender",
    dataType: "configurable-enum",
    additional: "genders",
  })
  gender: ConfigurableEnumValue;

  @DatabaseField({
    label: "School",
    dataType: "entity",
    additional: "School",
  })
  schoolId: string;
}
```

## @DatabaseField Options

```typescript
@DatabaseField({
  label: "Field Label",          // display label (translatable)
  dataType: "string",            // data type identifier (default: inferred from TS type)
  additional: "genders",         // extra config (e.g. enum ID, entity type)
  isArray: true,                 // array of values
  description: "Tooltip text",   // help text
  anonymize: "retain",           // PII handling: "retain" | "retain-anonymized"
})
```

## Custom Datatypes

Extend `DefaultDatatype` to create custom data types:

```typescript
@Injectable()
export class MyCustomDatatype extends DefaultDatatype<MyType, string> {
  static override dataType = "my-custom";
  static override label = "My Custom Type";

  transformToDatabaseFormat(value: MyType): string {
    // serialize for storage
  }

  transformToObjectFormat(value: string): MyType {
    // deserialize from storage
  }
}
```

Register in the entity module and create "edit" and "display" components for the datatype's UI.

## EntitySchemaService

Handles serialization/deserialization between entity objects and database format:

```typescript
const schemaService = inject(EntitySchemaService);

// Entity → DB format
const dbData = schemaService.transformEntityToDatabaseFormat(entity);

// DB format → Entity
const entity = schemaService.transformDatabaseToEntityFormat(dbData, ChildEntity);
```

## EntityMapperService — CRUD Operations

```typescript
const entityMapper = inject(EntityMapperService);

// Load
const child = await entityMapper.load(Child, "child-123");

// Save
await entityMapper.save(child);

// Remove
await entityMapper.remove(child);

// Load all of a type
const children = await entityMapper.loadType(Child);
```

## Permissions (CASL Integration)

Use `EntityAbility` to check permissions:

```typescript
const ability = inject(EntityAbility);

if (ability.can("update", entity)) {
  // user can edit
}
```

Use `DisableEntityOperationDirective` in templates to enforce permissions:

```html
<button
  *appDisabledEntityOperation="{
    entity: entity,
    operation: 'update'
  }"
>
  Edit
</button>
```

## Entity Lifecycle

1. Define entity class with `@DatabaseEntity` and `@DatabaseField` decorators
2. Register the entity type in the entity registry (automatic via decorator)
3. Configure entity fields through JSON config or annotations
4. Use `EntityMapperService` for CRUD operations
5. Implement demo data generators for testing (see `core/demo-data/`)

## Testing Entities

Use `TestEntity` for generic entity tests:

```typescript
import { TestEntity } from "../../utils/test-utils/TestEntity";

const entity = TestEntity.create({ name: "Test" });
expect(entity).toHaveType("TestEntity");
```
