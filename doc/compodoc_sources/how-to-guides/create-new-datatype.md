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

1. Create a new  class (according to our file name convention it should follow the pattern `my-custom.datatype.ts`)
2. Use inheritance to extend the `DefaultDatatype` class
3. Define your datatype identifier (which is used in `@DatabaseField` annotations in their `EntitySchemaField.dataType` definitions to use this type) by setting the `static override dataType = "my-custom"` property of your class
4. Define other important properties:
   - `label`: To allow admin users to select this type in the form builder under this human-readable name
   - `viewComponent`: The string ID for the DisplayComponent (see below) used for read-only presentation of the value in tables
   - `editComponent`: The string ID for the EditComponent (see below) used for form field UI of the value in detail views
5. Override any of the other aspects and methods if you want to customize, like the data transformation methods (see below)
6. **Register the datatype** using Angular DI system as a "multi" provider in your feature module to make it available to the system overall:
`{ provide: DefaultDatatype, useClass: MyCustomDatatype, multi: true }`


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


## Registering the new Datatype

Provide your datatype service using Angular dependency injection:
`{ provide: DefaultDatatype, useClass: MyCustomDatatype, multi: true },`

The EntitySchemaService, that handles all data transformations, and other platform modules automatically pick up your datatype
and use it for any entity properties that use the `dataType` identifier of your implementation.


## Implementing a custom EditComponent
To provide a custom UI, you can implement an Angular component that extends the `EditComponent` and configure it to be used for the datatype as shown above.

Such a component is a standard Angular component.
It has to extend the abstract "EditComponent" base class however
and needs to ensure changes are set into the `formControl` input property that the base class defines. This is the channel for editing to be picked up by the overall form, which takes care of saving changes also.

The `EditComponent` base class also provides access to a number of other `@Input` properties from the current context (i.e. the entity and field configuration).
You can use these to provide a custom UI and functionality, possibly even accessing other form fields or properties of the current entity.
Please refer to the code and comments in `EditComponent`.

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