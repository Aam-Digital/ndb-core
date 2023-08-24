/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Entity } from "../model/entity";
import { Injectable, Injector } from "@angular/core";
import { EntitySchema } from "./entity-schema";
import { EntitySchemaField } from "./entity-schema-field";
import { DefaultDatatype } from "../default-datatype/default.datatype";

/**
 * Transform between entity instances and database objects
 * based on the dataType set for properties in Entity classes using the {@link DatabaseField} annotation.
 *
 * You can inject the EntitySchemaService in your code to register your custom {@link DefaultDatatype} implementations.
 *
 * This service is used by the {@link EntityMapperService} to internally transform objects.
 * You should normally use the EntityMapperService instead of transforming objects yourself with the EntitySchemaService.
 *
 * also see the How-To Guides:
 * - [Create A New Entity Type]{@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 */
@Injectable({ providedIn: "root" })
export class EntitySchemaService {
  /**
   * Internal cache of datatype implementations.
   */
  private schemaTypes = new Map<string, DefaultDatatype>();

  private defaultDatatype: DefaultDatatype = new DefaultDatatype();

  constructor(private injector: Injector) {}

  /**
   * Get the datatype for the giving name (or the default datatype if no other registered type fits)
   * @param datatypeName The key/name of the datatype
   * @param failSilently If set to 'true' no error is thrown if datatype does not exist
   */
  public getDatatypeOrDefault(datatypeName: string, failSilently = false) {
    if (!datatypeName) {
      return this.defaultDatatype;
    }
    if (this.schemaTypes.has(datatypeName)) {
      return this.schemaTypes.get(datatypeName);
    }

    // use Injector instead of normal dependency injection in the constructor, because some Datatypes use the SchemaService (--> Circular Dependency)
    const dataTypes: DefaultDatatype[] = this.injector.get(
      DefaultDatatype,
    ) as unknown as DefaultDatatype[];

    let dataType = dataTypes.find((d) => d.dataType === datatypeName);
    if (dataType) {
      this.schemaTypes.set(datatypeName, dataType);
      return dataType;
    } else if (!failSilently) {
      throw new Error(`Data type "${datatypeName}" does not exist`);
    }
  }

  /**
   * Get the datatype of the innermost type of a field, e.g. the type contained in an array.
   * @param schemaField
   */
  public getInnermostDatatype(schemaField: EntitySchemaField) {
    let datatype;
    // do not use the Datatype classes here to avoid circular dependencies with EntitySchemaService
    if (schemaField.dataType === "array") {
      datatype = schemaField.innerDataType;
    } else if (schemaField.dataType === "entity-array") {
      datatype = "entity";
    } else {
      datatype = schemaField.dataType;
    }

    return this.getDatatypeOrDefault(datatype);
  }

  /**
   * Transform a database object to entity format according to the schema.
   * @param data The database object that will be transformed to the given entity format
   * @param schema A schema defining the transformation
   */
  public transformDatabaseToEntityFormat(data: any, schema: EntitySchema) {
    const transformed = {};
    for (const key of schema.keys()) {
      const schemaField: EntitySchemaField = schema.get(key);

      if (data[key] === undefined || data[key] === null) {
        continue;
      }

      const newValue = this.valueToEntityFormat(data[key], schemaField, data);
      if (newValue !== undefined) {
        transformed[key] = newValue;
      }

      if (schemaField.generateIndex) {
        throw new Error('schema option "isIndexed" not implemented yet');
      }
    }

    return transformed;
  }

  /**
   * Helper function to assign the giving data to the given entity instance after transforming it according to the schema.
   * @param entity An entity instance whose properties will be overwritten with the transformed data
   * @param data The database object that will be transformed and assigned to the entity
   */
  public loadDataIntoEntity(entity: Entity, data: any) {
    const transformed = this.transformDatabaseToEntityFormat(
      data,
      (<typeof Entity>entity.constructor).schema,
    );
    Object.assign(entity, transformed);
  }

  /**
   * Transform an entity instance to a database object according to the schema.
   * @param entity The object (an instance of an entity type)
   * @param schema The schema of the entity (if not explicitly defined the schema of the given entity is used)
   */
  public transformEntityToDatabaseFormat(
    entity: Entity,
    schema?: EntitySchema,
  ): any {
    if (!schema) {
      schema = entity.getSchema();
    }

    const data = {};

    for (const key of schema.keys()) {
      let value = entity[key];
      const schemaField: EntitySchemaField = schema.get(key);

      if (value === undefined || value === null) {
        // skip and keep undefined
        continue;
      }

      try {
        data[key] = this.valueToDatabaseFormat(value, schemaField, entity);
      } catch (err) {
        throw new Error(`Transformation for ${key} failed: ${err}`);
      }

      if (data[key] === undefined) {
        delete data[key];
      }
    }

    return data;
  }

  /**
   * Get the name of the component that should display this property.
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   *
   * @param propertySchema The schema definition of the attribute for which a component should be get
   * @param mode (Optional) The mode for which a component is required. Default is "view".
   * @returns string The name of the component which should display this property
   */
  getComponent(
    propertySchema: EntitySchemaField,
    mode: "view" | "edit" = "view",
  ): string {
    if (!propertySchema) {
      return undefined;
    }
    const componentAttribute =
      mode === "view" ? "viewComponent" : "editComponent";
    if (propertySchema[componentAttribute]) {
      return propertySchema[componentAttribute];
    }

    const dataType = this.getDatatypeOrDefault(propertySchema.dataType);
    if (dataType?.[componentAttribute]) {
      return dataType[componentAttribute];
    }

    const innerDataType = this.getDatatypeOrDefault(
      propertySchema.innerDataType,
    );
    if (innerDataType?.[componentAttribute]) {
      return innerDataType[componentAttribute];
    }
  }

  /**
   * Transform a single value into database format
   * @param value
   * @param schemaField
   * @param entity
   */
  valueToDatabaseFormat(
    value: any,
    schemaField: EntitySchemaField,
    entity?: Entity,
  ) {
    return this.getDatatypeOrDefault(
      schemaField.dataType,
    ).transformToDatabaseFormat(value, schemaField, entity);
  }

  /**
   * Transform a single value into entity format
   * @param value
   * @param schemaField
   * @param dataObject
   */
  valueToEntityFormat(
    value: any,
    schemaField: EntitySchemaField,
    dataObject?: any,
  ) {
    return this.getDatatypeOrDefault(
      schemaField.dataType,
    ).transformToObjectFormat(value, schemaField, dataObject);
  }
}
