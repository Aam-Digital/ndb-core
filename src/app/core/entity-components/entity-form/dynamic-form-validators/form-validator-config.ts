/**
 * Available validators that can be used to display errors to the user
 * when a form is invalid
 */
export type DynamicValidator =
  /** type: number */
  | "min"
  /** type: number */
  | "max"
  /** type: boolean */
  | "required"
  /** type: boolean */
  | "validEmail"
  /** type: string or regex */
  | "pattern";

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
