import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "./schema-embed.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/**
 * Datatype for an embedded "table" of custom entries on any entity.
 *
 * Generalizes {@link SchemaEmbedDatatype} to always store an *array* of embedded objects,
 * rendered as an editable/viewable table - one row per entry, one column per field defined
 * in `additional` (or the `embeddedType`, if a subclass sets one).
 *
 * Use this as `dataType: "schema-embed-array"` with the inner fields defined in `additional`,
 * e.g.:
 * ```json
 * {
 *   "dataType": "schema-embed-array",
 *   "additional": {
 *     "documentType": { "dataType": "string", "label": "Document Type" },
 *     "documentNumber": { "dataType": "string", "label": "Document Number" }
 *   }
 * }
 * ```
 */
@Injectable()
export class SchemaEmbedArrayDatatype<
  EntityType = any,
  DBType = any,
> extends SchemaEmbedDatatype<EntityType, DBType> {
  static override readonly dataType: string = "schema-embed-array";
  static override label: string = $localize`:datatype-label:embedded table (multiple entries with several fields)`;

  override editComponent = "EditSchemaEmbedArray";
  override viewComponent = "DisplaySchemaEmbedArray";

  override normalizeSchemaField(
    schemaField: EntitySchemaField,
  ): EntitySchemaField {
    // schema-embed-array always requires isArray
    return { ...schemaField, isArray: true };
  }
}
