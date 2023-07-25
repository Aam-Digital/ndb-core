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
import { EntitySchemaDatatype } from "./entity-schema-datatype";
import { Injectable } from "@angular/core";
import { defaultEntitySchemaDatatype } from "../schema-datatypes/datatype-default";
import { EntitySchema } from "./entity-schema";
import { EntitySchemaField } from "./entity-schema-field";
import { stringEntitySchemaDatatype } from "../schema-datatypes/datatype-string";
import { numberEntitySchemaDatatype } from "../schema-datatypes/datatype-number";
import { dateEntitySchemaDatatype } from "../schema-datatypes/datatype-date";
import { monthEntitySchemaDatatype } from "../schema-datatypes/datatype-month";
import { arrayEntitySchemaDatatype } from "../schema-datatypes/datatype-array";
import { schemaEmbedEntitySchemaDatatype } from "../schema-datatypes/datatype-schema-embed";
import { dateOnlyEntitySchemaDatatype } from "../schema-datatypes/datatype-date-only";
import { mapEntitySchemaDatatype } from "../schema-datatypes/datatype-map";
import { booleanEntitySchemaDatatype } from "../schema-datatypes/datatype-boolean";
import { entityArrayEntitySchemaDatatype } from "../schema-datatypes/datatype-entity-array";
import { entityEntitySchemaDatatype } from "../schema-datatypes/datatype-entity";
import { dateWithAgeEntitySchemaDatatype } from "../schema-datatypes/datatype-date-with-age";

/**
 * Transform between entity instances and database objects
 * based on the dataType set for properties in Entity classes using the {@link DatabaseField} annotation.
 *
 * You can inject the EntitySchemaService in your code to register your custom {@link EntitySchemaDatatype} implementations.
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
   * Internal registry of data type definitions.
   * You can extend the Schema system with your data type conversions by using EntitySchema.registerSchemaDatatype()
   */
  private schemaTypes = new Map<string, EntitySchemaDatatype>();

  constructor() {
    this.registerBasicDatatypes();
  }

  private registerBasicDatatypes() {
    this.registerSchemaDatatype(stringEntitySchemaDatatype);
    this.registerSchemaDatatype(numberEntitySchemaDatatype);
    this.registerSchemaDatatype(dateEntitySchemaDatatype);
    this.registerSchemaDatatype(dateOnlyEntitySchemaDatatype);
    this.registerSchemaDatatype(monthEntitySchemaDatatype);
    this.registerSchemaDatatype(dateWithAgeEntitySchemaDatatype);
    this.registerSchemaDatatype(arrayEntitySchemaDatatype);
    this.registerSchemaDatatype(schemaEmbedEntitySchemaDatatype);
    this.registerSchemaDatatype(mapEntitySchemaDatatype);
    this.registerSchemaDatatype(booleanEntitySchemaDatatype);
    this.registerSchemaDatatype(entityArrayEntitySchemaDatatype);
    this.registerSchemaDatatype(entityEntitySchemaDatatype);
  }

  /**
   * Add a datatype definition to the registry to provide a conversion between what is written into the database
   * and what is available in Entity objects.
   * @param type The EntitySchemaDatatype object definition providing data transformation functions.
   */
  public registerSchemaDatatype(type: EntitySchemaDatatype) {
    this.schemaTypes.set(type.name, type);
  }

  /**
   * Get the datatype for the giving name (or the default datatype if no other registered type fits)
   * @param datatypeName The key/name of the datatype
   */
  public getDatatypeOrDefault(datatypeName: string) {
    datatypeName = datatypeName ? datatypeName.toLowerCase() : undefined;

    if (this.schemaTypes.has(datatypeName)) {
      return this.schemaTypes.get(datatypeName);
    } else {
      return defaultEntitySchemaDatatype;
    }
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
      (<typeof Entity>entity.constructor).schema
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
    schema?: EntitySchema
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
    mode: "view" | "edit" = "view"
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
      propertySchema.innerDataType
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
    entity?: Entity
  ) {
    return this.getDatatypeOrDefault(
      schemaField.dataType
    ).transformToDatabaseFormat(value, schemaField, this, entity);
  }

  /**
   * Transform a single value into database format
   * @param value
   * @param schemaField
   * @param dataObject
   */
  valueToEntityFormat(
    value: any,
    schemaField: EntitySchemaField,
    dataObject?: any
  ) {
    return this.getDatatypeOrDefault(
      schemaField.dataType
    ).transformToObjectFormat(value, schemaField, this, dataObject);
  }
}
