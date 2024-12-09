import { Injectable } from "@angular/core";
import { StringDatatype } from "../string/string.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ColumnMapping } from "../../import/column-mapping";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";

@Injectable()
export class EntityDatatype extends StringDatatype {
  static override dataType = "entity";
  static override label: string = $localize`:datatype-label:link to another record`;

  override editComponent = "EditEntity";
  override viewComponent = "DisplayEntity";
  override importConfigComponent = "EntityImportConfig";

  constructor(
    private entityMapper: EntityMapperService,
    private removeService: EntityActionsService,
  ) {
    super();
  }

  /**
   * Maps a value from an import to an actual entity in the database by comparing the value with the given field of entities.
   * Handles type conversion between numbers and strings to improve matching.
   *
   * @param val The value from an import that should be mapped to an entity reference
   * @param schemaField The config defining details of the field that will hold the entity reference after mapping
   * @param additional The field of the referenced entity that should be compared with the val
   * @returns Promise resolving to the ID of the matched entity or undefined if no match is found
   */
  override async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: string,
  ): Promise<string | undefined> {
    // If no additional field is specified or value is null/undefined, return undefined
    if (!additional || val == null) {
      return undefined;
    }

    // Convert value to string or number for flexible matching
    const normalizedVal = this.normalizeValue(val);

    try {
      // Load all entities of the specified type
      const entities = await this.entityMapper.loadType(schemaField.additional);

      // Find the first entity where the specified field matches the normalized value
      const matchedEntity = entities.find((entity) => {
        const entityFieldValue = this.normalizeValue(entity[additional]);
        return entityFieldValue === normalizedVal;
      });

      // Return the ID of the matched entity or undefined
      return matchedEntity?.getId();
    } catch (error) {
      console.error("Error in EntityDatatype importMapFunction:", error);
      return undefined;
    }
  }

  /**
   * Normalize a value for comparison, converting to string or number as appropriate
   * @param val The value to normalize
   * @returns Normalized value (string or number)
   */
  private normalizeValue(val: any): string | number {
    // If the value is already a string or number, return it
    if (typeof val === "string" || typeof val === "number") {
      return val;
    }

    // Try to convert to number if possible
    const numVal = Number(val);
    if (!isNaN(numVal)) {
      return numVal;
    }

    // Convert to string as a fallback
    return String(val);
  }

  override importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return col.additional ? undefined : "?";
  }

  /**
   * Recursively calls anonymize on the referenced entity and saves it.
   * @param value
   * @param schemaField
   * @param parent
   */
  override async anonymize(
    value,
    schemaField: EntitySchemaField,
    parent,
  ): Promise<string> {
    const referencedEntity = await this.entityMapper.load(
      schemaField.additional,
      value,
    );

    if (!referencedEntity) {
      // TODO: remove broken references?
      return value;
    }

    await this.removeService.anonymize(referencedEntity);
    return value;
  }
}
