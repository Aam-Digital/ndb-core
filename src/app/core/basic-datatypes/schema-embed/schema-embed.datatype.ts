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

import {
  DefaultDatatype,
  referenceIdConditions,
} from "../../entity/default-datatype/default.datatype";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { getInnerEntityReferenceFields } from "../../entity/schema/entity-reference-fields";
import type { DataFilter } from "../../filter/filters/filters";
import {
  EntitySchema,
  SchemaEmbeddedType,
} from "../../entity/schema/entity-schema";
import { inject, Injectable } from "@angular/core";

/**
 * Configuration for the "schema-embed" datatype's `additional` field.
 *
 * Defines the inner schema of the embedded object, using the same format as
 * entity `attributes` config: a map of field names to their schema definitions.
 *
 * @example
 * ```
 * @DatabaseField({
 *   dataType: "schema-embed",
 *   additional: {
 *     "phoneNumber": { dataType: "string" },
 *     "type": { dataType: "string" }
 *   } as SchemaEmbedDatatypeAdditional
 * })
 * phoneNumber: { phoneNumber: string; type: string };
 * ```
 */
export interface SchemaEmbedDatatypeAdditional {
  [fieldId: string]: EntitySchemaField;
}

/**
 * Datatype for the EntitySchemaService transforming values of complex objects recursively.
 *
 * Can be used in two ways:
 * 1. **Config-based** (directly via annotation): Set `dataType: "schema-embed"` and define the inner schema
 *    in `additional` as a {@link SchemaEmbedDatatypeAdditional} map.
 * 2. **Subclass-based** (extending this class): Override `embeddedType` to point to a class
 *    with `@DatabaseField()` annotations.
 *
 * The config in `additional` is merged with the `embeddedType` schema (if present),
 * allowing runtime config to extend or override a class's annotations.
 */
@Injectable()
export class SchemaEmbedDatatype<
  EntityType = any,
  DBType = any,
> extends DefaultDatatype<EntityType, DBType> {
  static override readonly dataType: string = "schema-embed";

  embeddedType?: SchemaEmbeddedType<EntityType>;

  protected readonly schemaService = inject(EntitySchemaService);

  /**
   * Build the effective inner schema from the embedded type's annotations
   * and/or the `additional` config.
   */
  private getEffectiveSchema(schemaField?: EntitySchemaField): EntitySchema {
    // Clone the base schema to avoid mutating the original class schema
    const baseSchema: EntitySchema = new Map(
      this.embeddedType?.schema ?? new Map(),
    );
    const additional: SchemaEmbedDatatypeAdditional =
      schemaField?.additional ?? {};

    // Add schema from additional config, taking precedence over baseSchema if present
    for (const [key, value] of Object.entries(additional)) {
      baseSchema.set(key, { ...value, id: key });
    }

    return baseSchema;
  }

  /**
   * The embedded object is stored as-is, so an inner reference is matched through the
   * outer field - either inside an array of embedded objects or, where a single object
   * is stored, through the dotted path to the inner property.
   *
   * The inner keys come from `additional` only (not from {@link getEffectiveSchema}),
   * so they stay identical to the ones the in-memory post-filter inspects.
   */
  override getReferenceSelector(
    fieldId: string,
    schemaField: EntitySchemaField,
    referencedId: string,
  ): DataFilter<any>[] | undefined {
    const innerKeys = getInnerEntityReferenceFields(schemaField).map(
      ([key]) => key,
    );
    if (innerKeys.length === 0) {
      // nothing we could match on - let the caller load the whole type instead
      return undefined;
    }

    return innerKeys.flatMap((key) => [
      { [fieldId]: { $elemMatch: { [key]: referencedId } } },
      {
        [fieldId]: {
          $elemMatch: { [key]: { $elemMatch: { $eq: referencedId } } },
        },
      },
      ...referenceIdConditions(`${fieldId}.${key}`, referencedId),
    ]);
  }

  override transformToDatabaseFormat(
    value: EntityType,
    schemaField?: EntitySchemaField,
  ): DBType {
    const schema = this.getEffectiveSchema(schemaField);
    return this.schemaService.transformEntityToDatabaseFormat(
      value as any,
      schema,
    ) as DBType;
  }

  override transformToObjectFormat(
    value: DBType,
    schemaField?: EntitySchemaField,
  ): EntityType {
    const schema = this.getEffectiveSchema(schemaField);

    const transformedValue =
      this.schemaService.transformDatabaseToEntityFormat<EntityType>(
        value,
        schema,
      );

    if (this.embeddedType) {
      const instance = new this.embeddedType();
      Object.assign(instance, transformedValue);
      return instance;
    }

    return transformedValue;
  }
}
