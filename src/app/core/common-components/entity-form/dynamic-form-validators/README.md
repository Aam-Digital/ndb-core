# Form Validators

A field can have validation rules in its schema, under `validators`.
Each key is one rule, the value is that rule's setting:

```json
"validators": {
  "required": true,
  "max": 100,
  "pattern": { "pattern": "^[0-9]{10}$", "message": "Enter a 10-digit phone number" },
  "_warningOnly": ["max"]
}
```

Keys starting with `_` are settings, not rules:
`_warningOnly` lists the rules whose errors are only a warning.
The field shows the error, but users can still save after confirming "Save anyway?".
`required` and `readonlyAfterSet` cannot be only a warning (their `warning` is `"never"`):
a field that may stay empty is simply not required. The config check reports them in `_warningOnly`.

Every rule is a service extending `FieldValidator`, registered through Angular DI as a multi-provider
(like datatypes and default-value strategies).
`DynamicValidatorsService` builds the validators of a field from the registered rules,
and the config check (`ConfigValidationService`) asks them too, so a new rule needs no change in either.
The admin "Validation" tab is still written by hand per rule (see [Add a new rule](#add-a-new-rule)).

Besides the configured rules, a form field also gets
the `internalValidators` of its datatype (see [basic-datatypes](../../../basic-datatypes/README.md))
and the conditions of the user's permission rules.

## Use validators in a record type

Set them in the schema, in code or in the config:

```ts
@DatabaseField({
  label: "Phone",
  validators: { required: true, pattern: "^[0-9]{10}$" },
})
phone: string;
```

Every form built by the `EntityFormService` applies them.
A form of your own gets the same validators from `DynamicValidatorsService.buildValidators(field.validators, entity, field.id)`.

## Add a new rule

Extend `FieldValidator<Config>`, where `Config` is the type of the rule's setting in `validators`:

```ts
@Injectable()
export class MaxLengthValidator extends FieldValidator<number> {
  static override readonly key = "maxLength";
  override readonly datatypesSupported = [LongTextDatatype];

  build(maxLength: number): ValidatorFn {
    return (control) => (typeof control.value === "string" && control.value.length > maxLength ? { maxLength: { actual: control.value.length } } : null);
  }

  override message(): string {
    return $localize`Too long`;
  }
}
```

| Member                                   | What it does                                                                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static readonly key`                    | Key of the rule in `validators`, also the key of its error                                                                                                                                                                                                      |
| `build(value, context)`                  | The Angular validator, or `null` if it cannot be built. It is not called for a setting that switches the rule off (see `isSwitchedOff`). The `context` holds the record, the field, the whole `validators` config and whether the form edits one single record. |
| `isSwitchedOff(value)`                   | Whether the setting switches the rule off. By default `false`, `null` or an empty text (e.g. `required: false`).                                                                                                                                                |
| `requiresFieldId`                        | The rule needs the field's id (e.g. to compare with other records), so it is not built for a form field without one.                                                                                                                                            |
| `message(error)`                         | The readable message for the rule's error. By default the `errorMessage` the error carries.                                                                                                                                                                     |
| `datatypesSupported`                     | The datatypes the rule fits, including their subtypes (e.g. `DateDatatype` also covers date only, date of birth and month). Empty: all datatypes. The admin "Validation" tab only shows the setting for these.                                                  |
| `appliesTo(datatype, field)`             | Overrides `datatypesSupported` when the type alone is not enough. For example, `pattern` lists its types explicitly, as link and file fields extend the `StringDatatype` too.                                                                                   |
| `warning`                                | `"optional"` (default): admins can make it only a warning. `"always"`: its errors are always only a warning. `"never"`: it always blocks saving.                                                                                                                |
| `async`, `checkOnChange`                 | `async`: `build` returns an `AsyncPromiseValidatorFn` (e.g. to load other records). The field is then only checked when the user leaves it, unless `checkOnChange` is set.                                                                                      |
| `dependsOn(value)`                       | Other fields of the record the rule reads (e.g. the parent link of `withinParent`). The field is checked again when one of them changes.                                                                                                                        |
| `validateConfig(value, field, datatype)` | Problems of the setting, which admins are told about when they save the config.                                                                                                                                                                                 |

A rule that needs services injects them like any other service (`inject(EntityMapperService)`).
Do not inject the `EntityFormService`, as it uses the rules itself.

Register the rule in the providers of a module that the `AppModule` imports:

```ts
providers: [{ provide: FieldValidator, useClass: MaxLengthValidator, multi: true }];
```

The rules of the core module are in `standardFieldValidatorProviders`, and their keys are typed in `DYNAMIC_VALIDATORS`
for configs written in code.
The admin "Validation" tab (`ConfigureEntityFieldValidatorComponent`) has a setting only for the rules of the core module,
each shown only if the rule `appliesTo` the type selected there.
A rule of another module can be set in the config, and the tab keeps it as it is.
To give it a setting in the tab, add it there by hand, as for the core rules.

Unit-test the logic of the rule's check. Messages, warnings and checking a field again when the fields it depends on change
are handled centrally by `DynamicValidatorsService`.
