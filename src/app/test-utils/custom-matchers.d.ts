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
     * expects a form to be enabled
     */
    toBeEnabled(): boolean;

    /**
     * expects a key to be in a map
     * @param map
     */
    toBeKeyOf(map: Map<T, any>);

    /**
     * expects an entity to have the given ID
     * The ID is computed via `Entity#getId()`
     * @param id
     */
    toHaveId(id: string);

    /**
     * expects an entity to have the given entity-ID
     * The entity-ID is the ID of the entity-type without the prefix.
     * It is computed via `Entity#entityId`
     * @param entityId
     */
    toBeEntityType(entityId: string);

    /**
     * expects an entity to have a given type
     * The type of entity is equal to the static `ENTITY_TYPE`.
     * It is computed via `Entity#getType()`
     * @param entityType
     */
    toHaveType(entityType: string);

    /**
     * Expects an array-like object to be empty
     */
    toBeEmpty();

    /**
     * expects a number to be finite as defined via `Number#isFinite`
     */
    toBeFinite();

    /**
     * expects an object to have an own property
     * @param property
     */
    toHaveOwnProperty(property: string);

    /**
     * expects a date to be the same as the given date
     * @param date
     */
    toBeDate(date: number | string | Date);
  }
}
