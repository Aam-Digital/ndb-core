# How to create a new Datatype
"Datatypes" define how a single field (i.e. entity property) is stored and displayed.
They are core building blocks for all entities and can enable advanced functionality, like displaying a streetmap for an address.

The Aam Digital core defines most commonly known datatypes already (see `CoreModule`).
The architecture of datatypes is designed for extension however, so you can easily add further types.

## The base: `DefaultDatatype` and Angular Service
`DefaultDatatype` is the base class for all implementations of custom datatypes.
It implements default logic for all the required aspects so that you can override only those parts that are relevant for your new type.

Implementations of datatypes are normal Angular Services.
This allows you to inject and use any other service that you may need to do sophisticated data transformations.  

## Defining a new Datatype
- Create a new Angular Service class (according to our file name convention it should follow the pattern `my-custom.datatype.ts`)
- Use inheritance to extend the `DefaultDatatype` class
- Define your datatype identifier (which is used in `@DatabaseField` annotations in their `EntitySchemaField` definitions) by setting the `static dataType = "my-custom"` property of your class
- Override any of the other aspects if you want to customize them

This could result in a Datatype class like this:
```
@Injectable()
export class MyCustomDatatype extends DefaultDatatype {
  static dataType = "my-custom";
  
  constructor() {
    super();
    // use constructor to simply inject other services you need
  }
  
  editComponent = "EditMyCustomFormField";
  viewComponent = "DisplayText";
  // make sure to register your new components in the ComponentRegistry
  
  transformToDatabaseFormat(value) {
    return value.toString();
  }

  transformToObjectFormat(value) {
    return transformToSpecialObject(value);
  }
  
  importConfigComponent = "SpecialImportValueMapping";
  
  importMapFunction(value, schemaField: EntitySchemaField, additional?: any) {
    return SpecialValueParserForDifferentImportFormats(value);
  }
}
```

## Registering the new Datatype
Provide your datatype service using Angular dependency injection:
`{ provide: DefaultDatatype, useClass: MyCustomDatatype, multi: true },`

The EntitySchemaService, that handles all data transformations, and other platform modules automatically pick up your datatype
and use it for any entity properties that use the `dataType` identifier of your implementation.
