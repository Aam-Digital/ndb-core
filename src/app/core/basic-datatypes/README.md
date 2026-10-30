# How to create a new Datatype

"Datatypes" define how a single field (i.e. entity property) is stored and displayed.
They are core building blocks for all entities and can enable advanced functionality, like displaying a streetmap for an address.

The Aam Digital core defines most commonly known datatypes already (see `CoreModule`).
The architecture of datatypes is designed for extension however, so you can easily add further types.

A datatype consists of three parts that can be provided as custom implementations:

1. A `DefaultDatatype` implementation, defining a "name" for the type, how the values are stored in the DB and which components are used for it in the UI
2. An `EditComponent` implementation, defining a component that provides special UI for the FormField through which this type of values can be edited and viewed in Detail Views.
3. A `DisplayComponent` implementation, defining a component for showing the value in a read-only way (e.g. in table columns)

You can reuse the components of existing datatypes, if your type does not require customization for one of these aspects. However, you should implement a class extending the DefaultDatatype in order to register in the admin and configuration system.

## The base: Extending `DefaultDatatype`

`DefaultDatatype` is the base class for all implementations of custom datatypes.
It implements default logic for all the required aspects so that you can override only those parts that are relevant for your new type.

Implementations of new datatypes extend the `DefaultDatatype` and override the static attributes, that configure the name and UI for the new type, as well as (optionally) override the default method for transforming values for storage in the database and imports.

Datatype implementations are Angular Services.
You can use Angular's dependency injection to access any other services, if needed for more complex logic.

## Defining a new Datatype

1. Create a new class (according to our file name convention it should follow the pattern `my-custom.datatype.ts`)
2. Use inheritance to extend the `DefaultDatatype` class
3. Define your datatype identifier (which is used in `@DatabaseField` annotations in their `EntitySchemaField.dataType` definitions to use this type) by setting the `static override dataType = "my-custom"` property of your class
4. Define other important properties:
   - `label`: To allow admin users to select this type in the form builder under this human-readable name
   - `viewComponent`: The string ID for the DisplayComponent (see below) used for read-only presentation of the value in tables
   - `editComponent`: The string ID for the EditComponent (see below) used for form field UI of the value in detail views
5. Override any of the other aspects and methods if you want to customize, like the data transformation methods (see below)
6. **Register the datatype** as a "multi" provider so the platform picks it up (see [Registering the new Datatype](#registering-the-new-datatype) below).

This could result in a Datatype class like this:

```
@Injectable()
export class MyCustomDatatype extends DefaultDatatype<SpecialObject, string> {
  static override dataType = "my-custom";
  static override label: string = $localize`:datatype-label:My Custom Type`;

  override editComponent = "EditMyCustom";
  override viewComponent = "DisplayText";
  // make sure to register your new components in the ComponentRegistry (see below)

  constructor() {
    super();
    // use constructor to simply inject other services you need
    // alternatively you can also use Angular's `inject()` function
  }

  transformToDatabaseFormat(value: SpecialObject): string {
    // storing as string in the database for whatever reason
    return value.toString();
  }

  transformToObjectFormat(value: string): SpecialObject {
    return transformToSpecialObject(value);
  }

  importConfigComponent = "SpecialImportValueMapping";

  importMapFunction(value: any, schemaField: EntitySchemaField, additional?: any) {
    return SpecialValueParserForDifferentImportFormats(value);
  }
}
```

Please also refer to the extensive JsDoc code comments in the `DefaultDatatype` class.

## Datatypes for combined values

A datatype can store several values together in one field. The `date-range` type is an example: it holds a
start and an end date as one object (`{ start: "2026-03-01", end: "2026-05-31" }` in the database), either of which
can be missing. Its datatype class reuses the `date-only` conversion for both dates, and it contributes its own edit
component (a range picker), display component, sorting (by start date), export (one column per date) and
anonymization. See [`date-range`](date-range/date-range.datatype.ts).

Next to the calendar, its edit component offers predefined periods (the current and the last month, quarter and year).
The `additional` config of the field can change them: a list in the format of the options of date filters
(`DateRangeFilterConfigOption`) replaces them, and an empty list offers none. In the Admin UI, a checkbox
switches them off.

## Embedded tables (`schema-embed-array`)

The `schema-embed-array` type stores an array of custom sub-objects on the entity itself, for example several
identification documents of a person. It is the lightweight alternative to a separate entity type that is linked
through `RelatedEntities`: use it for entries that have no life of their own (no separate record, permissions or
list view). It generalizes the `attendance` type, which extends it
(see [`SchemaEmbedArrayDatatype`](schema-embed/schema-embed-array.datatype.ts)).

The inner fields are defined in the `additional` config of the field, in the same format as entity `attributes`.
`isArray` is set automatically:

```json
"identificationDocuments": {
  "dataType": "schema-embed-array",
  "label": "Identification Documents",
  "additional": {
    "documentType": { "dataType": "string", "label": "Document Type" },
    "documentNumber": { "dataType": "string", "label": "Document Number" },
    "issueDate": { "dataType": "date", "label": "Issue Date" }
  }
}
```

**Display and editing**

- In forms, the field shows a summary of its entries with a button that opens a popup with the full table.
  Each entry is added or edited in a popup of its own.
- Wherever the value is only displayed (e.g. in table columns), the first column's values of the first entries are
  shown (e.g. "Passport, ID Card +1 more"). Hovering shows a preview table with all entries.

**Panel in the entity details**

The `EmbeddedArrayData` component shows the entries as a table in a panel of the entity details view, like a list of
related records. Its config is:

- `property`: the entity field of type `schema-embed-array`
- `columns` (optional): the inner fields to show, as ids or column config objects that override the field details,
  e.g. `{ "id": "issueDate", "visibleFrom": "md" }`. Defaults to all inner fields.
- `editable` (optional, default `true`): whether entries can be added and edited.

```json
{
  "title": "Identification Documents",
  "components": [
    {
      "component": "EmbeddedArrayData",
      "config": {
        "property": "identificationDocuments",
        "columns": ["documentType", "documentNumber", { "id": "issueDate", "visibleFrom": "md" }]
      }
    }
  ]
}
```

Saving an entry in this panel saves the entity directly, as the panel is not part of an entity form with a "Save"
button. Users without the permission to update the field only see the entries (read-only). See the full example in
[`Config_CONFIG_ENTITY.json`](../../../assets/base-configs/all-features/Config_CONFIG_ENTITY.json).

**Not yet configurable in the Admin UI.** The Admin UI cannot configure the inner fields yet
([#3840](https://github.com/Aam-Digital/ndb-core/issues/3840)), so the type is not offered in its field type
dropdown (the datatype has no `label`). Define such fields in the config JSON.

**For developers:** a subclass can set `embeddedType` to a class with `@DatabaseField()` annotations instead of (or in
addition to) defining the inner fields in `additional`; the config is merged over the annotations. See
[`SchemaEmbedDatatype`](schema-embed/schema-embed.datatype.ts) and `AttendanceDatatype`
(`AttendanceItem` as `embeddedType`).

## Customizing how values are sorted in tables

By default, table columns are sorted on the readable value of the field.
Some datatypes store arrays or complex objects whose raw value cannot be compared meaningfully,
or want to sort by some metadata rather than the displayed text.

Override the `sortValue` method to return a comparable primitive (a `number` or `string`)
for a given field value. Return `undefined` to fall back to the default sort logic.

```
override sortValue(value: SpecialObject): number | string | undefined {
  // e.g. sort configurable enums by their configured ordinal position
  // rather than alphabetically by their label
  return value?._ordinal;
}
```

`EntitiesTableComponent` builds a map of these `sortValue` functions per column
and passes them to `tableSort`, so any datatype-specific ordering you define here
is automatically applied wherever the type is used in a sortable list.

## Registering the new Datatype

Provide your datatype service using Angular dependency injection:
`{ provide: DefaultDatatype, useClass: MyCustomDatatype, multi: true },`

The EntitySchemaService, that handles all data transformations, and other platform modules automatically pick up your datatype
and use it for any entity properties that use the `dataType` identifier of your implementation.

## Implementing a custom EditComponent

To provide a custom UI, implement an Angular component that extends `CustomFormControlDirective` and implements the `EditComponent` interface, then configure it for the datatype as shown above.

See [Entity Form components](../entity-details/form/README.md#creating-a-custom-form-control) for the `CustomFormControlDirective` base class and its reactive API — it handles the `MatFormFieldControl` plumbing so parent components can use your component like a simple `matInput` field.

Your custom EditComponent should _not_ include a form field label.
This and other mat-form-field details are automatically added by the parent component.

The `EditComponent` interface shows the properties you can access from the current context
(i.e. the entity and field configuration).
These are automatically assigned to the component through the parent components and structure.
You can use these to provide a custom UI and functionality, possibly even accessing other form fields or properties of the current entity.

### Registering the new Component

In order to make a component accessible under a string ID required for the configuration system, you need to explicitly register it beyond the standard Angular imports:

```
constructor(components: ComponentRegistry) {
  components.addAll([
    [
      "EditMyCustom", // This string ID can be used in config objects, like `Datatype.editComponent`
      () =>
        // We import the components in this indirect way to support lazy-loading
        import("./edit-my-custom/edit-my-custom.component").then(
          (c) => c.EditMyCustomComponent,
        ),
    ],
  ]);
}
```

We usually implement this registration code in the constructor of the feature module.
It is important that this has been called before other components during runtime might try to access the component.
