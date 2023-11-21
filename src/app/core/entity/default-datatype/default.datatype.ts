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

import { EntitySchemaField } from "../schema/entity-schema-field";
import { Entity } from "../model/entity";
import { ColumnMapping } from "../../import/column-mapping";

/**
 * Extend this class to define new data types (i.e. for properties of entities)
 * and provide your implementation using Angular DI:
 * `{ provide: DefaultDatatype, useClass: MyCustomDatatype, multi: true },`
 *
 * This class is also used as the default fallback Datatype for the EntitySchemaService that keeps values unchanged between database and entity instance.
 * This type is automatically used whenever no fitting Datatype can be found for that config or TypeScript type.
 */
export class DefaultDatatype<EntityType = any, DBType = any> {
  /**
   * Key for this datatype that must be specified in the DatabaseField annotation to use this transformation.
   *
   * for example `@DatabaseField({dataType: 'foo'}) myField` will trigger the datatype implementation with `name` "foo".
   *
   * If you set the name to a TypeScript type, class properties with this type will automatically use
   * that EntitySchemaDatatype without the need to explicitly state the dataType config in the annotation
   * (e.g. `@DatabaseField() myField: string` is triggering the EntitySchemaDatatype with `name` "string".
   */
  static dataType: string = "";
  get dataType(): string {
    return (this.constructor as typeof DefaultDatatype).dataType;
  }

  /**
   * The default component how this datatype should be displayed in lists and forms.
   *
   * The edit component has to be a registered component. Components that are registered contain the `DynamicComponent`
   * decorator
   */
  viewComponent = "DisplayText";
  editComponent = "EditText";

  /**
   * Transformation function taking a value in the format that is used in entity instances and returning the value
   * in the format used in database objects.
   *
   * @param value The value (in Entity format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  transformToDatabaseFormat(
    value: EntityType,
    schemaField?: EntitySchemaField,
    parent?: Entity,
  ): DBType {
    return value as any;
  }

  /**
   * Transformation function taking a value in the format that is used in database objects and returning the value
   * in the format used in entity instances.
   *
   * @param value The value (in database format) to be transformed
   * @param schemaField The EntitySchemaField configuration providing details of how the value should be transformed.
   *          This can be set as a parameter to the `@DatabaseField()` annotation in Entity classes.
   * @param parent The full entity instance this value is part of (e.g. to allow cross-related transformations)
   */
  transformToObjectFormat(
    value: DBType,
    schemaField?: EntitySchemaField,
    parent?: any,
  ): EntityType {
    return value as any;
  }

  /**
   * The function used to map values from the import data to values in the entities to be created.
   * @param val The value from an imported cell to be mapped
   * @param schemaField The schema field definition for the target property into which the value is mapped
   * @param additional config as returned by the configComponent
   */
  async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: any,
  ): Promise<EntityType> {
    return this.transformToObjectFormat(val, schemaField);
  }

  /**
   * A component to be display as a dialog to configure the transformation function
   * (e.g. defining a format or mapping)
   */
  importConfigComponent?: string;

  /**
   * Output a label indicating whether the given column mapping needs user configuration for the "additional" config
   * or has a valid, complete "additional" config.
   * returns "undefined" if no user action is required.
   * @param col
   */
  importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return undefined;
  }

  /**
   * (Partially) anonymize to "retain-anonymized" for reporting purposes without personal identifiable information.
   * @param value The original value to be anonymized
   */
  async anonymize(
    value: EntityType,
    schemaField: EntitySchemaField,
    parent: any,
  ): Promise<any> {
    return undefined;
  }
}
