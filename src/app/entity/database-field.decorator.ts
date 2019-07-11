import 'reflect-metadata'
/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 * Note: Property decorators are called before class decorators.
 * @param fieldSchema The schema definition for this property.
 */
import {SchemaFieldOptions} from './schema/entity-schema';

export function DatabaseField(dataType: string, options: SchemaFieldOptions = {}) {
  return (targetEntity, property: string) => {
    let design =  Reflect.getMetadata('design:type', targetEntity, property);
    let types =  Reflect.getMetadata('design:paramtypes', targetEntity, property);
    console.log('design', design, 'types', types);
    // Adding a dummy object to store the schemas // TODO: document why "localSchema" is needed
    if (!targetEntity.constructor.hasOwnProperty('localSchema')) {
      targetEntity.constructor.localSchema = {};
    }
    targetEntity.constructor.schema[property] = { dataType, options };

    //  This ensures that the field is not read only
    targetEntity[property] = undefined;

    return targetEntity;
  };
}
