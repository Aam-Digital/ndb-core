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

import { EntitySchemaField } from "./entity-schema-field";
import { EntitySchemaService } from "./entity-schema.service";
import { Entity } from "../model/entity";
import { ImportValueMapping } from "../../../features/import/import-column-mapping/import-value-mapping";
import { ComponentType } from "@angular/cdk/overlay";
import { ColumnMapping } from "../../../features/import/column-mapping";

/**
 * Implement this to define new data types (i.e. for properties of entities)
 * and provide your implementation using Angular DI:
 * `{ provide: EntityDatatype, useClass: MyCustomDatatype, multi: true },`
 */
export abstract class AbstractDatatype<EntityType = any, DBType = any>
  implements ImportValueMapping
{
  /**
   * Key for this datatype that must be specified in the DatabaseField annotation to use this transformation.
   *
   * for example `@DatabaseField({dataType: 'foo'}) myField` will trigger the datatype implementation with `name` "foo".
   *
   * If you set the name to a TypeScript type, class properties with this type will automatically use
   * that EntitySchemaDatatype without the need to explicitly state the dataType config in the annotation
   * (e.g. `@DatabaseField() myField: string` is triggering the EntitySchemaDatatype with `name` "string".
   */
  static dataType: string;
  get dataType(): string {
    return (this.constructor as typeof AbstractDatatype).dataType;
  }

  /**
   * The default component how this datatype should be displayed in lists and forms.
   *
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   */
  viewComponent?: string;

  editComponent?: string;

  /**
   * Transformation function taking a value in the format that is used in entity instances and returning the value
   * in the format used in database objects.
   *
   * @param value The value (in Entity format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param schemaService A reference to the EntitySchemaService instance (e.g. to allow recursive transformations)
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  abstract transformToDatabaseFormat(
    value: EntityType,
    schemaField?: EntitySchemaField,
    parent?: Entity,
  ): DBType;

  /**
   * Transformation function taking a value in the format that is used in database objects and returning the value
   * in the format used in entity instances.
   *
   * @param value The value (in database format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param schemaService A reference to the EntitySchemaService instance (e.g. to allow recursive transformations)
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  abstract transformToObjectFormat(
    value: DBType,
    schemaField?: EntitySchemaField,
    parent?: any,
  ): EntityType;

  /**
   * The function used to map values from the import data to values in the entities to be created.
   * @param val The value from an imported cell to be mapped
   * @param schemaField The schema field definition for the target property into which the value is mapped
   * @param additional config as returned by the configComponent
   */
  importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: any,
  ): EntityType {
    return this.transformToObjectFormat(val, schemaField);
  }

  /**
   * A component to be display as a dialog to configure the transformation function
   * (e.g. defining a format or mapping)
   */
  importConfigComponent?: ComponentType<any>;

  /**
   * Output a label indicating whether the given column mapping needs user configuration for the "additional" config
   * or has a valid, complete "additional" config.
   * returns "undefined" if no user action is required.
   * @param col
   */
  importIncompleteAdditionalConfigBadge?: (col: ColumnMapping) => string;
}

// TODO: remove
/**
 * Interface to be implemented by any Datatype transformer of the Schema system.
 */
export interface EntitySchemaDatatype<EntityType = any, DBType = any> {
  /**
   * Key for this datatype that must be specified in the DatabaseField annotation to use this transformation.
   *
   * for example `@DatabaseField({dataType: 'foo'}) myField` will trigger the datatype implementation with `name` "foo".
   *
   * If you set the name to a TypeScript type, class properties with this type will automatically use
   * that EntitySchemaDatatype without the need to explicitly state the dataType config in the annotation
   * (e.g. `@DatabaseField() myField: string` is triggering the EntitySchemaDatatype with `name` "string".
   */
  name: string;

  /**
   * The default component how this datatype should be displayed in lists and forms.
   *
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   */
  viewComponent?: string;

  editComponent?: string;

  /**
   * Transformation function taking a value in the format that is used in entity instances and returning the value
   * in the format used in database objects.
   *
   * @param value The value (in Entity format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param schemaService A reference to the EntitySchemaService instance (e.g. to allow recursive transformations)
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  transformToDatabaseFormat(
    value: EntityType,
    schemaField?: EntitySchemaField,
    schemaService?: EntitySchemaService,
    parent?: Entity,
  ): DBType;

  /**
   * Transformation function taking a value in the format that is used in database objects and returning the value
   * in the format used in entity instances.
   *
   * @param value The value (in database format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param schemaService A reference to the EntitySchemaService instance (e.g. to allow recursive transformations)
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  transformToObjectFormat(
    value: DBType,
    schemaField?: EntitySchemaField,
    schemaService?: EntitySchemaService,
    parent?: any,
  ): EntityType;
}
