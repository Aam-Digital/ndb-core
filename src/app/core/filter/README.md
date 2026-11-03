# Filters and Conditions

Wherever records are selected by a configurable rule, the rule is a `DataFilter`:
a MongoDB-style query as understood by [ucast](https://github.com/stalniy/ucast),
e.g. `{ "gender": "F", "dateOfBirth": { "$gte": "2010-01-01" } }`.
This module holds the filter UI of lists and the shared code to evaluate these queries.

## Where conditions are used

| Use                                    | Configured in                                                  | Evaluated by                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List filters (filter UI) and prefilter | `filters` and `filter` of a list view                          | in memory, or CouchDB for lists of an online-only session (see [Engines](#engines))                                                                                                                        |
| Related entities                       | the relation property and `filter` of the related entities tab | in memory, or CouchDB as above                                                                                                                                                                             |
| Matching entities, roll call setup     | `prefilter` / `filter` of the view                             | in memory                                                                                                                                                                                                  |
| Entity select                          | `validators.selectionCondition` of an entity field             | in memory, on the record with its unsaved form values                                                                                                                                                      |
| Display conditions                     | `displayCondition` of a form field or field group              | in memory, on the record with its unsaved form values                                                                                                                                                      |
| Conditional colors                     | `color` of an entity type                                      | in memory                                                                                                                                                                                                  |
| Delete / anonymize cascades            | the reference fields of the record types                       | a database query (`EntityRelationsService`, built with `referenceIdConditions` and normalized like list queries) where the database supports queries, otherwise checked in code on all records of the type |
| Permissions                            | `conditions` of the rules in `Config:Permissions`              | CASL on the stored format, see [permissions](../permissions/README.md)                                                                                                                                     |
| Notification rules                     | the conditions of a notification rule                          | aam-services backend, on the stored format                                                                                                                                                                 |

## Writing a condition

**Values in the stored format.** Compare a field with its value as it is saved in the database:
the id of a dropdown option (`{ "gender": "F" }`), the id of a referenced record,
`"YYYY-MM-DD"` for a `date-only` field and `"YYYY-MM"` for a `month` field.
Records are matched in this format everywhere, also in memory (see [Engines](#engines)).
Older configs address dropdown options by their object (`{ "gender.id": "F" }`), which still works.
Values that only the entity has, like a getter of the entity class or the `age` of a date of birth
(`{ "dateOfBirth.age": { "$gte": 18 } }`), can be used in memory, but not in a database query.

**Dates are compared by day.** For a `date` field (a timestamp), compare with a day (`"YYYY-MM-DD"`):
a date matches if it falls on that day in local time (see `toStoredDateBound`). A `month` counts as its first day.

**Multi-value fields** match if one of their values matches: `{ "category": { "$elemMatch": { "$eq": "A" } } }`
or `{ "category": { "$elemMatch": { "$in": ["A", "B"] } } }`.

**Embedded fields** (like the entries of an `attendance` field) are addressed by a dotted path (`attendance.status`).
A condition on one entry is wrapped in `$elemMatch`: `{ "attendance": { "$elemMatch": { "status": "ABSENT" } } }`.
Inside `$elemMatch`, write several conditions on the same entry as keys of one object, never with `$and` or `$or`:
the in-memory engine rejects both there. Alternatives go outside, as an `$or` of `$elemMatch` conditions.
The conditions editor (display conditions, selection conditions) offers the properties of embedded fields
and stores a row on one as such a condition on an entry; two rows on the same embedded field may match different entries.

**"Not defined"** (`createEmptyValueFilter`) matches a missing, `null` or empty value (and an empty list for multi-value fields).
For an embedded list it matches records without entries or with at least one entry without a value.

**Negation** (`$ne`, `$nin`) inside `$elemMatch` matches records with at least one entry not having the value.

**Placeholders** in condition values are resolved before the condition is evaluated:
`"$current_record.<fieldId>"` (in a `selectionCondition`) stands for a field of the record being edited,
see `DynamicPlaceholderValueService.resolveRecordPlaceholders`. A row referencing an empty field is left out.

## Engines

| Engine                                        | Used for                        | Pitfalls                                                                                                                                                      |
| --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| in memory: `FilterService.getFilterPredicate` | everything evaluated in memory  | a comparison with a missing value counts as equal (add `$exists: true`); no `$and`/`$or` in `$elemMatch`                                                      |
| CouchDB Mango, via `PaginatedDataSource`      | lists of an online-only session | case-insensitive `$regex` is rewritten to `(?i)` (`convertToCouchRegex`); values only the entity has cannot be queried                                        |
| pouchdb-find                                  | `MemoryPouchDatabase` in tests  | gets an `$and` of several `$or` wrong                                                                                                                         |
| CASL (`EntityAbility`, replication-backend)   | permissions                     | its own, stricter matcher on the record converted to the stored format; matches conditions in the stored format like in memory (see `entity-ability.spec.ts`) |

Both the in-memory engine and the database query normalize a condition first (`toStoredFormatCondition` in `stored-format.ts`):
old `.id` keys, the stored paths of embedded fields (like the tuples of an old attendance field) and the day bounds of date fields.
In memory, `FilterService` then matches each record converted to the stored format (`toStoredFormatRecord`),
once per saved revision of a record.
Conditional colors (`Entity.getColorWithConditions`) and the `MockEntityMapperService` of the unit tests
use the same engine (`createFilterPredicate` in `utils/filter-compare-utils.ts`), but on the entity as it is.
The engine compares with `extendedCompare`, so that a `Date` matches a day string and a dropdown option object matches its id.

## Key files

- `filters/filters.ts` — `DataFilter`, the `Filter` base class of the list filter UI, helpers to combine conditions,
  the "not defined" condition and the `$current_record` placeholder helpers
- `filter-generator/filter-generator.service.ts` — builds the list filters from config, including those for embedded fields
- `embedded-field-filter.ts` — turns a condition on a property of an embedded field into one on the embedding field,
  and defines "not defined" for it; used by list filters and related entities
- `../entity/default-datatype/default.datatype.ts` (`referenceIdConditions`) — "the field contains this id",
  for both single-value and multi-value fields; used by list filters and the delete / anonymize cascades
- `filters/*Filter.ts` — the filter types offered in lists (dropdown, entity, date, boolean, prebuilt)
- `filter.service.ts` — the in-memory engine, and `alignEntityWithFilter` to pre-fill a new record so that it matches a condition
  ("Add new" in related entities and the entity select): it applies the conditions requiring one specific value,
  also for an entry of an embedded field, and converts the stored values through the field's datatype
- `stored-format.ts` — normalizes conditions and converts records to the stored format, for the in-memory engine and database queries
