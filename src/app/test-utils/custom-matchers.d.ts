declare namespace jasmine {
  interface Matchers<T> {
    /**
     * expects a form to contain a certain error
     * @param error
     */
    toContainFormError(error: string): boolean;

    /**
     * expects a form, form-group or form-array to have a certain value
     * @param formValue
     */
    toHaveValue(formValue: any): boolean;

    /**
     * expects a form to be valid
     */
    toBeValidForm(): boolean;

    /**
     * expects a key to be in a map
     * @param map
     */
    toBeKeyOf(map: Map<T, any>);
  }
}
