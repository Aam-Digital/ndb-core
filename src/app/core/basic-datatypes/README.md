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
   - `internalValidators`: Rules that every value of the type has to pass, added to every entity form field of this type (independent of the edit component and in addition to the `validators` configured for the field)
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
component (a range picker), display component, sorting (by start date), export (one column per date),
anonymization and a validator (the end must not be before the start). See [`date-range`](date-range/date-range.datatype.ts).

Next to the calendar, its edit component offers predefined periods (the current and the last month, quarter and year).
The `additional` config of the field can change them: a list in the format of the options of date filters
(`DateRangeFilterConfigOption`) replaces them, and an empty list offers none. In the Admin UI, a checkbox
switches them off.

A date range can be checked against the range of a linked "parent" record (e.g. a sub-action's period within its
parent action's period) with the `withinParent` validator of the field (in its `validators`): `parentReferenceField` is
the field linking to the parent, `parentValueField` the date range field of the parent (by default the field with the
same id, as in a hierarchy of records of the same type). A missing date leaves the range open on that side (e.g. no end
date = ongoing). A range beyond the parent's is only a warning: its validation error is marked with `warning: true`, so
saving (or merging records) asks the user to confirm it instead of being blocked (see `EntityFormService.confirmValidity`). In view mode and in
lists, where no validation runs, a warning icon shows instead. When the parent link changes in the same form, the
form validates the range again. See [`within-parent-validator.ts`](date-range/within-parent-validator.ts). In the Admin UI, the "Validation" tab of a date
range field sets it ("Must lie within the period of a linked record").

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
