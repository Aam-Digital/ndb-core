import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { asArray } from "../../../utils/asArray";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { getEmbeddedEntityReferenceFields } from "../schema/embedded-schema-field.util";
import { Logging } from "../../logging/logging.service";
import type { DataFilter } from "../../filter/filters/filters";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";

/** fields of an entity type that another type links to (see {@link EntityRelationsService.getFieldsOfLinkedTypes}) */
export interface LinkedTypeFields {
  /** id of the field linking to the type */
  linkId: string;
  link: EntitySchemaField;
  linkedType: EntityConstructor;
  /** the matching fields of the linked type, as [id, schema] */
  fields: [string, EntitySchemaField][];
}

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
   * Get the fields of the given data type in each entity type that the given type links to,
   * along with the field linking to it.
   *
   * e.g. given Child and "date-range" -> [{ linkId: "projectSchool", linkedType: School, fields: [["dateRangeField", …]] }]
   */
  getFieldsOfLinkedTypes(
    entityType: EntityConstructor,
    dataType: string,
  ): LinkedTypeFields[] {
    return Array.from(entityType.schema)
      .filter(([, link]) => link.dataType === EntityDatatype.dataType)
      .flatMap(([linkId, link]) =>
        asArray(link.additional ?? [])
          .filter((typeId) => this.entityRegistry.has(typeId))
          .map((typeId) => {
            const linkedType = this.entityRegistry.get(typeId);
            return {
              linkId,
              link,
              linkedType,
              fields: Array.from(linkedType.schema).filter(
                ([, field]) => field.dataType === dataType,
              ),
            };
          }),
      );
  }

  /**
   * Check whether a schema field references the given entity type,
   * including nested references inside embedded schemas (e.g. attendance fields).
   */
  private fieldReferencesType(field: EntitySchemaField, type: string): boolean {
    if (asArray(field.additional).includes(type)) {
      return true;
    }

    return getEmbeddedEntityReferenceFields(this.schemaService, field).some(
      ([, inner]) => asArray(inner.additional).includes(type),
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
        fields: this.fieldsIncludingId(
          entity,
          primaryEntity.getId(),
          refProperties,
        ),
      }))
      .filter((affected) => affected.fields.length > 0);

    return affectedEntities;
  }

  /**
   * The records of the given type that may reference the primary entity.
   *
   * Where every referencing property can express itself as a database query, this loads
   * only the matching records instead of the whole entity type - which is what keeps a
   * merge or a cascading delete from transferring the entire database.
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

  /**
   * Check whether a single value (a plain ID string or an embedded object)
   * references the given entity ID.
   *
   * When the `field` is an embedded schema field, only its inner properties
   * holding entity references (`dataType: "entity"`) are inspected.
   * Without such schema info the function falls back to checking all object values.
   */
  itemReferencesId(
    item: any,
    refId: string,
    field?: EntitySchemaField,
  ): boolean {
    if (item === refId) {
      return true;
    }

    if (typeof item === "object" && item !== null) {
      const refFields = getEmbeddedEntityReferenceFields(
        this.schemaService,
        field,
      );
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
  private fieldsIncludingId(
    entity: Entity,
    refId: string,
    relevantFields: FormFieldConfig[],
  ): FormFieldConfig[] {
    return relevantFields.filter((field) =>
      asArray(entity[field.id]).some((item) =>
        this.itemReferencesId(item, refId, field),
      ),
    );
  }
}
