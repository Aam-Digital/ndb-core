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
The admin "Validation" tab is built from the registered rules too (see [Admin settings](#admin-settings-of-a-rule)).

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
  readonly label = $localize`Maximum length`;
  override readonly configComponent = "NumberValidatorSetting";
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
| `label`                                  | Name of the rule in the admin "Validation" tab, in its list and in the dropdown "Add validation rule". Use `labelFor(datatype)` to name it differently for a datatype (e.g. a limit of a month field).                                                          |
| `description`                            | Optional. Explains the rule to admins, as a help text next to its name.                                                                                                                                                                                         |
| `configComponent`                        | Optional. The admin component that edits the rule's setting (see [Admin settings](#admin-settings-of-a-rule)). Without one, the rule is only switched on or off.                                                                                                |
| `build(value, context)`                  | The Angular validator, or `null` if it cannot be built. It is not called for a setting that switches the rule off (see `isSwitchedOff`). The `context` holds the record, the field, the whole `validators` config and whether the form edits one single record. |
| `isSwitchedOff(value)`                   | Whether the setting switches the rule off. By default `false`, `null` or an empty text (e.g. `required: false`).                                                                                                                                                |
| `requiresFieldId`                        | The rule needs the field's id (e.g. to compare with other records), so it is not built for a form field without one.                                                                                                                                            |
| `message(error)`                         | The readable message for the rule's error. By default the `errorMessage` the error carries.                                                                                                                                                                     |
| `datatypesSupported`                     | The datatypes the rule fits, including their subtypes (e.g. `DateDatatype` also covers date only, date of birth and month). Empty: all datatypes. The admin "Validation" tab only shows the setting for these.                                                  |
| `appliesTo(datatype, field)`             | Overrides `datatypesSupported` when the type alone is not enough. For example, `pattern` lists its types explicitly, as link and file fields extend the `StringDatatype` too.                                                                                   |
| `warning`                                | `"optional"` (default): admins can make it only a warning. `"always"`: its errors are always only a warning. `"never"`: it always blocks saving, and runs as a sync validator, so `build` must not return a promise.                                            |
| `checkOnBlur`                            | The check is expensive (e.g. it loads other records), so the field is only checked when the user leaves it. `build` may return a sync validator or one returning a promise: rules that can be only a warning run as async validators.                           |
| `angularValidator`                       | Angular's own validator that form fields look for (e.g. `Validators.required` marks a field as required). It is added to the field as it is, next to the rule's check. Only for a rule whose `warning` is `"never"`.                                            |
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

## Admin settings of a rule

The admin "Validation" tab (`ConfigureEntityFieldValidatorComponent`) lists the rules that are set for the field,
and a dropdown "Add validation rule" offers the registered rules that fit the type selected there (those that `appliesTo` it).
A rule only needs its `label`: it then appears in the dropdown and can be switched on or off.

If the rule has a setting (a number, a date, a pattern …), name a component for it in `configComponent`.
The core module has components for the common settings, reuse them before writing one:
`NumberValidatorSetting`, `DateValidatorSetting`, `PatternValidatorSetting`.
Your own component gets the `formControl` with the rule's value (`null` while it is not set),
and the inputs of `ValidatorSettingInputs` that it declares: `label`, `description`, the `field` being edited with its currently selected type,
the `entityType` of the field and, for a link field, the `linkedEntityType`.
Register it in the component registry like other dynamic components (`@DynamicComponent("MyValidatorSetting")` and `components.addAll` in your module).

A rule of a module that is not loaded in the admin area can still be set in the config, and the tab keeps it,
unless the field's type is changed to one the rule does not fit.

Unit-test the logic of the rule's check. Messages, warnings and checking a field again when the fields it depends on change
are handled centrally by `DynamicValidatorsService`.
