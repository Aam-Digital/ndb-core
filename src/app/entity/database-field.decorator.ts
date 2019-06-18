
/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 * Note: Property decorators are called before class decorators.
 * @param fieldSchema The schema definition for this property.
 */
export function DatabaseField(fieldSchema: string) {
  return (targetEntity, property: string) => {

    // Adding a dummy object to store the schemas // TODO: document why "localSchema" is needed
    if (!targetEntity.constructor.hasOwnProperty('localSchema')) {
      targetEntity.constructor.localSchema = {};
    }
    targetEntity.constructor.localSchema[property] = fieldSchema;

    return targetEntity;
  };
}
