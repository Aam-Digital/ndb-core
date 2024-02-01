declare namespace jasmine {
  interface Matchers<T> {
    /**
     * expects a form to contain a certain error
     * @param error
     */
    toContainFormError(error: string): void;

    /**
     * expects a form, form-group or form-array to have a certain value
     * @param formValue
     */
    toHaveValue(formValue: any): void;

    /**
     * expects a form to be valid
     */
    toBeValidForm(): void;

    /**
     * expects a form to be enabled
     */
    toBeEnabled(): void;

    /**
     * expects a map to contain a key
     */
    toHaveKey(key: any): void;

    /**
     * expects an entity to have a given type
     * The type of entity is equal to the static `ENTITY_TYPE`.
     * It is computed via `Entity#getType()`
     * @param entityType
     */
    toHaveType(entityType: string): void;

    /**
     * Expects an array-like object to be empty
     */
    toBeEmpty(): void;

    /**
     * expects a number to be finite as defined via `Number#isFinite`
     */
    toBeFinite(): void;

    /**
     * expects an object to have an own property
     * @param property
     */
    toHaveOwnProperty(property: string): void;

    /**
     * expects a date to be the same as the given date
     * @param date
     */
    toBeDate(date: number | string | Date): void;
  }
}
