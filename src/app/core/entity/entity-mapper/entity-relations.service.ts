import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { asArray } from "../../../utils/asArray";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaField } from "../schema/entity-schema-field";

/**
 * Service to work with related, interlinked entities.
 */
@Injectable({
  providedIn: "root",
})
export class EntityRelationsService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);

  /**
   * Get all entity types whose schema includes fields referencing the given type.
   *
   * e.g. given Child -> [Note, ChildSchoolRelation, ...]
   * @param type
   */
  getEntityTypesReferencingType(type: string): {
    entityType: EntityConstructor;
    referencingProperties: FormFieldConfig[];
  }[] {
    const referencingTypes = [];
    for (const t of this.entityRegistry.values()) {
      for (const [key, field] of t.schema.entries()) {
        if (this.fieldReferencesType(field, type)) {
          let refType = referencingTypes.find((e) => e.entityType === t);
          if (!refType) {
            refType = { entityType: t, referencingProperties: [] };
            referencingTypes.push(refType);
          }

          refType.referencingProperties.push({ ...field, id: key });
        }
      }
    }
    return referencingTypes;
  }

  /**
   * Check whether a schema field references the given entity type,
   * including nested references inside embedded schemas (e.g. attendance fields).
   */
  private fieldReferencesType(field: EntitySchemaField, type: string): boolean {
    if (asArray(field.additional).includes(type)) {
      return true;
    }

    // Check nested embedded schema (e.g. { participant: { dataType: "entity", additional: ["Child"] } })
    if (
      typeof field.additional === "object" &&
      !Array.isArray(field.additional)
    ) {
      for (const innerField of Object.values(
        field.additional as Record<string, FormFieldConfig>,
      )) {
        if (asArray(innerField.additional).includes(type)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find all entities that reference the given entity.
   * @param entity The entity to find references to
   * @returns An array of objects containing an entity referencing the given entity and its specific fields that reference it
   */
  async loadAllLinkingToEntity(
    entity: Entity,
  ): Promise<{ entity: Entity; fields: FormFieldConfig[] }[]> {
    const linkedEntities = [];

    const entityTypesWithReferences = this.getEntityTypesReferencingType(
      entity.getType(),
    );

    for (const refType of entityTypesWithReferences) {
      const referencedEntities = await this.loadLinkedEntitiesOfType(
        entity,
        refType.entityType,
        refType.referencingProperties,
      );
      linkedEntities.push(...referencedEntities);
    }

    return linkedEntities;
  }

  /**
   * Search through all entities of the given type and find those that reference the given entity.
   * @param primaryEntity The entity to which the other entities include a reference
   * @param refType The entity type of the entities to search for references to primaryEntity
   * @param refProperties The fields of the refType entities that may contain a reference (based on the refType's schema)
   * @private
   */
  private async loadLinkedEntitiesOfType(
    primaryEntity: Entity,
    refType: EntityConstructor,
    refProperties: FormFieldConfig[],
  ) {
    const entities = await this.entityMapper.loadType(refType);

    const affectedEntities = entities
      .map((entity) => ({
        entity,
        fields: fieldsIncludingId(entity, primaryEntity.getId(), refProperties),
      }))
      .filter((affected) => affected.fields.length > 0);

    return affectedEntities;
  }
}

/**
 * Check whether a single value (a plain ID string or an embedded object)
 * references the given entity ID.
 */
export function itemReferencesId(item: any, refId: string): boolean {
  return (
    item === refId ||
    (typeof item === "object" &&
      item !== null &&
      Object.values(item).includes(refId))
  );
}

/**
 * Return the fields of entity that contain the given refId.
 * If there is no such referenced ID, the array will be empty.
 * @param entity
 * @param refId
 * @param relevantFields The entity fields to check for the refId
 */
function fieldsIncludingId(
  entity: Entity,
  refId: string,
  relevantFields: FormFieldConfig[],
): FormFieldConfig[] {
  return relevantFields.filter((field) =>
    asArray(entity[field.id]).some((item) => itemReferencesId(item, refId)),
  );
}
