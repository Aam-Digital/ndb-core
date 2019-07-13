import 'reflect-metadata'
import {SchemaFieldOptions} from './schema/entity-schema';

/**
 * Decorator (Annotation `@DatabaseEntity()`) to set the string ENTITY_TYPE to an Entity Type.
 * Note: Property decorators are called before class decorators.
 * @param fieldSchema The schema definition for this property.
 * @param arrayType (optional) needs to be provided if property is an array.
 */
export function DatabaseField(dataType: string, options: SchemaFieldOptions = {}, arrayType = '') {
  return (targetEntity, property: string) => {
    let expDataType = Reflect.getMetadata('design:type', targetEntity, property).name.toLowerCase();
    if (expDataType === 'array') {
        expDataType = arrayType;
        options['isArray'] = true;
    }
    console.log('property', property, 'name', expDataType);

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
