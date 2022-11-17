/**
 * Custom error indicating details of a failed form validation.
 */
export class InvalidFormFieldError extends Error {
  constructor() {
    super("Invalid form fields");
    Object.setPrototypeOf(this, InvalidFormFieldError.prototype);
  }
}
