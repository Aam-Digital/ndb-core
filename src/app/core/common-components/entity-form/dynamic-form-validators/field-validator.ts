import { ValidatorFn } from "@angular/forms";
import { Entity } from "../../../entity/model/entity";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { FormFieldConfig } from "../FormConfig";
import { FormValidatorConfig } from "./form-validator-config";
import { AsyncPromiseValidatorFn } from "./validator-types";

/** the field (of a record) that a validator is built for */
export interface ValidatorContext {
  /** the record that the form is editing */
  entity: Entity;
  /** the field's config as in the form (extended from the schema), e.g. for the record types a link field offers */
  field?: FormFieldConfig;
  /** false if the form does not edit one single record (e.g. in bulk edit), so there is no record to compare with */
  singleRecord: boolean;
  /** the whole `validators` config of the field, for rules that also read the setting of another rule */
  config: FormValidatorConfig;
}

/**
 * A validation rule that admins can configure for a field, under its {@link FieldValidator.key} in the field's `validators`.
 *
 * Extend this class and register the implementation in a module imported by the AppModule:
 * `{ provide: FieldValidator, useClass: MyValidator, multi: true }`.
 * See the README of this folder.
 */
export abstract class FieldValidator<Config = any> {
  /** key of the rule in a field's `validators` config */
  static key: string;

  get key(): string {
    return (this.constructor as typeof FieldValidator).key;
  }

  /** the datatypes the rule is offered for, including their subtypes; empty for all datatypes */
  readonly datatypesSupported: (abstract new (
    ...args: any[]
  ) => DefaultDatatype)[] = [];

  /**
   * Whether an error of the rule only warns, so that users can still save after confirming it:
   * "optional" if admins can make it a warning, "always" or "never".
   */
  readonly warning: "optional" | "always" | "never" = "optional";

  /** the check is async (e.g. it loads records), its `build` returns an {@link AsyncPromiseValidatorFn} */
  readonly async: boolean = false;

  /** an async check runs on every change of the value (e.g. a selection), not only when leaving the field */
  readonly checkOnChange: boolean = false;

  /** whether the rule is offered for a field of the given datatype */
  appliesTo(datatype: DefaultDatatype, _field: EntitySchemaField): boolean {
    return (
      this.datatypesSupported.length === 0 ||
      this.datatypesSupported.some((type) => datatype instanceof type)
    );
  }

  /** the validator for the configured value, `null` if the value switches the rule off (e.g. `required: false`) */
  abstract build(
    value: Config,
    context: ValidatorContext,
  ): ValidatorFn | AsyncPromiseValidatorFn | null;

  /** the readable message for an error of the rule (by default the `errorMessage` it carries) */
  message(error: any): string | undefined {
    return error?.errorMessage;
  }

  /** other fields of the record the rule reads, so that the field is checked again when one of them changes */
  dependsOn(_value: Config): string[] {
    return [];
  }

  /** problems of the rule's config for the given field, which admins are told about when saving the config */
  validateConfig(
    _value: Config,
    _field: EntitySchemaField,
    _datatype: DefaultDatatype,
  ): string[] {
    return [];
  }
}
