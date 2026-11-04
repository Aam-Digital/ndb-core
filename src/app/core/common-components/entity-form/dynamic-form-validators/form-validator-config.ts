/**
 * All validator names supported in a {@link FormValidatorConfig}
 * (also used to validate the config when an admin saves it).
 */
export const DYNAMIC_VALIDATORS = [
  /** type: number */
  "min",
  /** type: number */
  "max",
  /** type: string/date */
  "minDate",
  /** type: string/date */
  "maxDate",
  /** type: number */
  "minAge",
  /** type: number */
  "maxAge",
  /** type: boolean */
  "required",
  /** type: boolean; validate field value is unique among entities of same type */
  "uniqueId",
  /** type: boolean */
  "readonlyAfterSet",
  /** type: string or regex */
  "pattern",
  /** type: WithinParentConfig; warns (without blocking saving) when a date range goes beyond the one of a linked parent */
  "withinParent",
  /**
   * type: DataFilter; for fields referencing another entity type:
   * a Mango/MongoDB style query condition that the referenced records have to match
   * to be offered for selection in this field.
   *
   * Condition values can refer to fields of the record being edited
   * through a placeholder like `"$current_record.location"`, including its unsaved changes.
   * If such a referenced field is empty, the rows of the condition referencing it are not applied.
   * The same applies if there is no single record, like in bulk edit.
   *
   * Only applies to a field referencing a single record type and edited with the entity dropdown
   * (or an edit component using it), not if a form layout sets another `editComponent`.
   * A `schema-embed` field (e.g. `attendance`) takes it in the config of its embedded
   * entity field (e.g. `additional.participant.validators.selectionCondition`).
   *
   * Records that do not match can still be shown by the user on request,
   * and already selected records are kept even if they do not match (anymore).
   * A selected record that does not match is only a warning: users can still save after confirming it
   * (not checked for an embedded field like the participants of `attendance`).
   * The warning only appears when the user changed this field or a field the condition refers to
   * (e.g. a new `location` that existing links do not match), not on every save of a record linked before.
   * Selected records that do not match are still marked with a warning icon at the field.
   */
  "selectionCondition",
] as const;

/**
 * Available validators that can be used to display errors to the user
 * when a form is invalid
 */
export type DynamicValidator = (typeof DYNAMIC_VALIDATORS)[number];

/**
 * the validators config. This is an object where the key
 * must be one of the `DynamicValidators`. The value to that key
 * is specific to that validator.
 * For example, the `max` validator requires a number while the `pattern`
 * validator requires a string or regex.
 * Compliant examples:
 * <pre>
 * {
 *   min: 5,
 *   pattern: "[a-z]*",
 * }
 * </pre>
 * The `pattern` validator alternatively supports an object form
 * to display a custom error message when validation fails:
 * <pre>
 * {
 *   pattern: { pattern: "[0-9]{10}", message: "Enter a 10-digit phone number" },
 * }
 * </pre>
 * Non-compliant examples:
 * <pre>
 * {
 *   min: "abc",
 *   rabbit: true
 * }
 * </pre>
 */
export type FormValidatorConfig = {
  [key in DynamicValidator]?: any;
};

/** config of the `withinParent` validator (for "date-range" fields) */
export interface WithinParentConfig {
  /** field of this record that links to the parent record(s) */
  parentReferenceField: string;

  /**
   * field of the parent record holding the range this value should lie within
   * (default: the same field id as this field, e.g. for a hierarchy of records of the same type)
   */
  parentValueField?: string;
}
