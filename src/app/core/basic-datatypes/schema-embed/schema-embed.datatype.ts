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
 * Build the inner schema of an embedded field from the embedded type's own schema
 * and the field's `additional` config (a {@link SchemaEmbedDatatypeAdditional} map).
 *
 * An entry in `additional` only overrides what it states explicitly (e.g. restricting the
 * allowed entity types of a reference), everything else (`dataType`, `label`, ...)
 * is inherited from the embedded type's field of the same id.
 *
 * @param baseSchema schema of the embedded type (e.g. `embeddedType.schema`), not mutated
 * @param additional the `additional` config of the field holding the embedded object(s)
 */
export function mergeEmbeddedSchema(
  baseSchema: EntitySchema | undefined,
  additional: unknown,
): EntitySchema {
  const schema: EntitySchema = new Map(baseSchema ?? []);
  if (
    !additional ||
    typeof additional !== "object" ||
    Array.isArray(additional)
  ) {
    return schema;
  }

  for (const [key, value] of Object.entries(
    additional as SchemaEmbedDatatypeAdditional,
  )) {
    if (value && typeof value === "object") {
      schema.set(key, { ...schema.get(key), ...value, id: key });
    }
  }
  return schema;
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
  getEffectiveSchema(schemaField?: EntitySchemaField): EntitySchema {
    return mergeEmbeddedSchema(
      this.embeddedType?.schema,
      schemaField?.additional,
    );
  }

  /**
   * The embedded object is stored as-is, so an inner reference is matched through the
   * outer field - either inside an array of embedded objects or, where a single object
   * is stored, through the dotted path to the inner property.
   *
   * The inner keys come from {@link getEffectiveSchema}.
   */
  override getReferenceSelector(
    fieldId: string,
    schemaField: EntitySchemaField,
    referencedId: string,
  ): DataFilter<any>[] | undefined {
    const innerKeys = getInnerEntityReferenceFields(
      this.getEffectiveSchema(schemaField),
    ).map(([key]) => key);
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
