/**
 * Available validators that can be used to display errors to the user
 */
export type DynamicValidator =
  | "min"
  | "max"
  | "required"
  | "validEmail"
  | "pattern";

/**
 * the validators config
 */
export type FormValidatorConfig = {
  [key in DynamicValidator]?: any;
};
