# Demo data

In demo mode, and whenever the setup assistant is asked for sample data, the app fills the
database with made-up records so that every screen has something to show.

Demo data is generated **from the configuration of the system it runs in**: the
`GenericDemoDataEngine` reads each entity type's schema and invents a value per field. A use case
does not need code to get demo data — it only needs entity types, and optionally a recipe
(`Config:DemoData`) to tune the result.

## How a record is filled

For each field, in this order:

1. the recipe's entry for that field (`valuePool`, `faker`, …)
2. a field with a `defaultValue` is left to the app — except a dropdown, which always gets one of
   its options
3. a **name heuristic**: `firstname`/`vorname` → a first name, `lastname`/`surname`/`nachname` →
   a surname, a plain `name` → a full name (or a surname when a first-name field sits next to it),
   `phone`/`tel…` → a phone number, `…mail…` → an email address
4. the **generator registered for the field's datatype**
5. otherwise the field is left empty

A field with a `required` validator never stays empty if its value can be invented safely.
Datatypes nothing is registered for — `file`, `photo`, `attendance` — are left empty on purpose:
a value their view cannot read is worse than none.

**References are filled in a second pass**, once every type has records, by sampling the records of
the field's target type(s). This is why creation order does not matter and why self-references and
multi-target references work. The second pass only fills references that are still empty, so links
a generator set itself are kept.

## The recipe: `Config:DemoData`

A JSON document imported with the base config, keyed by entity type. Everything is optional.

```json
{
  "_id": "Config:DemoData",
  "data": {
    "Child": {
      "count": 120,
      "fields": {
        "projectNumber": { "faker": "string.numeric", "fakerArgs": [5] },
        "dateOfBirth": { "min": 6, "max": 20 },
        "gender": { "ids": ["M", "F"] },
        "admissionDate": { "yearsPast": 10 },
        "motherTongue": { "valuePool": ["Hindi", "Bengali", "Urdu"] },
        "dropoutDate": { "nullProbability": 0.85, "after": "admissionDate" }
      },
      "samples": [{ "interests": "Cricket and music", "remarks": "Very motivated." }]
    }
  }
}
```

Per type: `count` (how many records, `0` for none) and `samples`. Per field: `valuePool`,
`faker` + `fakerArgs`, `nullProbability`, `after`, plus any option the field's datatype
understands (`min`/`max`, `ids`, `yearsPast`).

- **`samples`** are hand-written records that set several fields together, one drawn per record —
  how the note stories work. Use them for text that should read like the real thing, in the
  language of the use case; the fields a sample does not mention are generated as usual.
- **`faker`** names a method of [faker.js](https://fakerjs.dev/api/) by path, for fields whose
  meaning neither the datatype nor the name reveals. An unknown path leaves the field empty.
- **`after`** keeps a date on or after another field's date. Each field is generated on its own,
  so without it a record can drop out before it was admitted.

Multi-lingual values work anywhere in the recipe: `getConfig` resolves them to the active language
before the engine reads them.

**Use cases hosted elsewhere** (loaded through `external-sources.json`) carry their own recipe in
their own repository, next to their config. That is the supported way for a partner to control
their sample data without a change here.

## Teaching a datatype

Register a generator next to the datatype itself, with no change to anything here:

```typescript
@Injectable()
export class MyDatatypeDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = MyDatatype.dataType;

  generate(field: EntitySchemaField, { faker, options }: DemoValueContext) {
    return faker.lorem.word();
  }
}

// in the feature's module
{ provide: DEMO_VALUE_GENERATOR, useClass: MyDatatypeDemoValueGenerator, multi: true }
```

`options` holds the recipe's remaining keys for the field, so a generator can take parameters
(`min`, `max`, `ids`, …) without the engine knowing about them.
`LocationDemoValueGenerator` in `features/location/` is a working example.

## When a generator of its own is needed

Some data cannot be described field by field: a series of records year after year, attendance
spread over events, the fixed `demo` and `demo-admin` accounts. Those keep a
`DemoDataGenerator` subclass, registered in `demo-data.module.ts`.

Such a generator:

- declares the types it creates in `ownedEntityTypes`, so the engine leaves them alone
- reads the engine's records from `DemoEntityStore` (e.g. `get("Child")`) instead of injecting
  another generator
- writes only the fields its own logic is about, and calls
  `GenericDemoDataEngine.fillRemainingFields(record, type)` for the rest — otherwise its records
  miss everything else the use case configured on that type
- must not assume the field names of one use case. Check the schema (`schema.has(...)`) before
  writing a field that only some use cases have.

## Key files

- `generic/generic-demo-data-engine.ts` — the engine and its two passes
- `generic/demo-data-spec.ts` — the recipe format
- `generic/demo-value-generator.ts` — the `DEMO_VALUE_GENERATOR` extension point
- `generic/core-demo-value-generators.ts` — the generators for the core datatypes
- `generic/demo-name-heuristics.ts` — the field-name rules
- `generic/demo-entity-store.ts` — the generated records, shared between generators
- `demo-data.service.ts` — runs every generator, then the linking pass, then saves
- `demo-data-initializer.service.ts` — demo mode: accounts, login, triggering generation
- `faker.ts` — the seeded faker instance
