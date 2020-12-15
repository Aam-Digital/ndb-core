/**
 * Overall result of a form validation in an {@link EntitySubrecordComponent}.
 */
export interface FormValidationResult {
  /** whether validation has succeeded without errors */
  hasPassedValidation: boolean;

  /** message displayed to explain validation problems */
  validationMessage: string;
}
