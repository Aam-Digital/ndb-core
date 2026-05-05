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

import { $localize } from "@angular/localize/init"; // import needed to make this file work in e2e test fixtures also
import { EntitySchemaField } from "../schema/entity-schema-field";
import { Entity, EntityConstructor } from "../model/entity";
import { asArray } from "../../../utils/asArray";

/**
 * Definition of an export column contributed by a datatype.
 *
 * Each datatype's `getExportColumns` returns an array of these,
 * fully controlling which CSV columns a field produces.
 */
export interface ExportColumnMapping<EntityType = any> {
  /**
   * Suffix appended to the source field id to build the final export column key.
   * Use an empty string for the primary/default column.
   */
  keySuffix: string;

  /**
   * Human-readable header shown in the exported CSV.
   */
  label: string;

  /**
   * Resolve the value for this export column.
   */
  resolveValue: (
    value: EntityType,
    schemaField: EntitySchemaField,
  ) => Promise<any> | any;
}

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

  /**
   * Detect the first field of the given datatype(s) in an entity's schema.
   *
   * Scans the schema for a field whose `dataType` matches one of the provided strings
   * and returns its property name.
   *
   * Subclasses typically override this without the extra `dataTypes` parameter,
   * forwarding their own relevant datatype identifiers.
   *
   * @param entityOrType An entity instance or entity constructor to inspect.
   * @param dataTypes One or more datatype identifiers to match against.
   * @returns The field name of the first matching field, or `undefined` if none is found.
   */
  static detectFieldInEntity(
    entityOrType: Entity | EntityConstructor,
    dataTypes: string | string[],
  ): string | undefined {
    const fields = this.detectAllFieldsInEntity(entityOrType, dataTypes);
    return fields.length > 0 ? fields[0].fieldId : undefined;
  }

  /**
   * Detect all fields of the given datatype(s) in an entity's schema.
   *
   * @param entityOrType An entity instance or entity constructor to inspect.
   * @param dataTypes One or more datatype identifiers to match against.
   * @returns Array of matching fields with their id and schema definition.
   */
  static detectAllFieldsInEntity(
    entityOrType: Entity | EntityConstructor,
    dataTypes: string | string[],
  ): { fieldId: string; schemaField: EntitySchemaField }[] {
    dataTypes = asArray(dataTypes);

    const schema =
      "schema" in entityOrType
        ? (entityOrType as EntityConstructor).schema
        : entityOrType.getConstructor().schema;

    const result: { fieldId: string; schemaField: EntitySchemaField }[] = [];
    for (const [fieldId, field] of schema.entries()) {
      if (dataTypes.includes(field.dataType)) {
        result.push({ fieldId, schemaField: field });
      }
    }
    return result;
  }

  /**
   * Whether this datatype allows multiple values to be mapped to the same entity field
   * during import.
   */
  readonly importAllowsMultiMapping: boolean = false;

  get dataType(): string {
    return (this.constructor as typeof DefaultDatatype).dataType;
  }

  /**
   * The human-readable name for this dataType, used in config UIs.
   */
  static label: string = $localize`:datatype-label:any`;
  get label(): string {
    return (this.constructor as typeof DefaultDatatype).label;
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
   * @param importProcessingContext an object that the datatype can use to store any relevant context across multiple calls
   *                                to share information across processing of multiple columns and rows.
   */
  async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: any,
    importProcessingContext?: any,
  ): Promise<EntityType> {
    return this.transformToObjectFormat(val, schemaField);
  }

  /**
   * A component to be rendered inline to configure the import transformation
   * (e.g. defining a format or value mapping).
   *
   * The component receives inputs:
   * `col`, `rawData`, `entityType`, `otherColumnMappings`, `additionalSettings`, `onColumnMappingChange`
   */
  importConfigComponent?: string;

  /**
   * Return the (potentially adjusted) schema field for this datatype.
   *
   * Called when schema fields are set up (e.g. from config),
   * allowing the datatype to normalize or fill in required settings.
   *
   * Override this in a subclass to enforce constraints
   * (e.g. always setting `isArray: true`).
   *
   * @param schemaField The current schema field definition
   * @returns The schema field to use (default: unchanged)
   */
  normalizeSchemaField(schemaField: EntitySchemaField): EntitySchemaField {
    return schemaField;
  }

  /**
   * Export columns for a field using this datatype.
   *
   * Each returned column contributes a CSV header and its own value resolver.
   * The returned `keySuffix` is appended to the field id to form the exported column key.
   *
   * The default implementation returns a single column with the raw field value.
   * Readable formatting can be applied by callers during CSV transformation.
   * Override this to provide custom or additional columns (e.g. entity references
   * can add a human-readable name column alongside the ID column).
   */
  getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping<EntityType>[] {
    if (!schemaField.label) {
      return [];
    }
    return [
      {
        keySuffix: "",
        label: schemaField.label,
        resolveValue: (value) => value,
      },
    ];
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
