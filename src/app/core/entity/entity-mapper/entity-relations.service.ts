import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { asArray } from "../../../utils/asArray";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { getInnerEntityReferenceFields } from "../schema/entity-reference-fields";
import { Logging } from "../../logging/logging.service";
import type { DataFilter } from "../../filter/filters/filters";

/**
 * Service to work with related, interlinked entities.
 */
@Injectable({
  providedIn: "root",
})
export class EntityRelationsService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly schemaService = inject(EntitySchemaService);

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

    return getInnerEntityReferenceFields(field).some(([, inner]) =>
      asArray(inner.additional).includes(type),
    );
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
    const entities = await this.loadCandidates(
      primaryEntity,
      refType,
      refProperties,
    );

    const affectedEntities = entities
      .map((entity) => ({
        entity,
        fields: fieldsIncludingId(entity, primaryEntity.getId(), refProperties),
      }))
      .filter((affected) => affected.fields.length > 0);

    return affectedEntities;
  }

  /**
   * The records of the given type that may reference the primary entity.
   *
   * Where every referencing property can express itself as a database query, this loads
   * only the matching records instead of the whole entity type - which is what keeps a
   * merge or a cascading delete from transferring the entire database (see #4134).
   *
   * All-or-nothing per type: a full load already contains every property's matches, so
   * combining it with queries for the remaining properties would transfer the same
   * documents twice. The caller post-filters the result either way, so a query that
   * matches too much is harmless.
   */
  private async loadCandidates(
    primaryEntity: Entity,
    refType: EntityConstructor,
    refProperties: FormFieldConfig[],
  ): Promise<Entity[]> {
    if (!this.entityMapper.supportsFind(refType)) {
      // a local database answers no queries, but its full load is cheap
      return this.entityMapper.loadType(refType);
    }

    const conditions: DataFilter<any>[] = [];
    for (const refProperty of refProperties) {
      const datatype = this.schemaService.getDatatypeOrDefault(
        refProperty.dataType,
      );
      const propertyConditions = datatype.getReferenceSelector(
        refProperty.id,
        refProperty,
        primaryEntity.getId(),
      );

      if (!propertyConditions?.length) {
        Logging.debug(
          "loading all records of an entity type because a referencing field cannot be queried",
          { entityType: refType.ENTITY_TYPE, field: refProperty.id },
        );
        return this.entityMapper.loadType(refType);
      }
      conditions.push(...propertyConditions);
    }

    if (conditions.length === 0) {
      return [];
    }
    return this.entityMapper.findAllType(refType, { $or: conditions });
  }
}

/**
 * Check whether a single value (a plain ID string or an embedded object)
 * references the given entity ID.
 *
 * When a `field` schema is provided and its `additional` defines an embedded
 * schema, only the inner properties declared as entity references
 * (`dataType: "entity"`) are inspected.  Without schema info the function
 * falls back to checking all object values (backward-compatible).
 */
export function itemReferencesId(
  item: any,
  refId: string,
  field?: EntitySchemaField,
): boolean {
  if (item === refId) {
    return true;
  }

  if (typeof item === "object" && item !== null) {
    const refFields = getInnerEntityReferenceFields(field);
    if (refFields.length > 0) {
      return refFields.some(([key]) => asArray(item[key]).includes(refId));
    }
    // Fallback when no embedded schema info is available
    return Object.values(item).includes(refId);
  }

  return false;
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
    asArray(entity[field.id]).some((item) =>
      itemReferencesId(item, refId, field),
    ),
  );
}
