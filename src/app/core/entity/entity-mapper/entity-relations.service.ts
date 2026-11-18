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
        if (this.fieldReferencesType(field, [type])) {
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
   * Get the fields (of the given data type, if any) in each entity type that the given type links to,
   * along with the field linking to it.
   *
   * e.g. given Child and "date-range" -> [{ linkId: "projectSchool", linkedType: School, fields: [["dateRangeField", …]] }]
   */
  getFieldsOfLinkedTypes(
    entityType: EntityConstructor,
    dataType?: string,
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
                ([, field]) => !dataType || field.dataType === dataType,
              ),
            };
          }),
      );
  }

  /**
   * Check whether a schema field references (any of) the given entity types,
   * including nested references inside embedded schemas (e.g. attendance fields).
   */
  fieldReferencesType(
    field: EntitySchemaField | undefined,
    types: string[],
  ): boolean {
    if (!field) {
      return false;
    }
    if (asArray(field.additional).some((type) => types.includes(type))) {
      return true;
    }

    return getEmbeddedEntityReferenceFields(this.schemaService, field).some(
      ([, inner]) => asArray(inner.additional).some((t) => types.includes(t)),
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
   * Find the entities of one type that reference any of the given entities in one specific field,
   * grouped by the entity they reference.
   *
   * Unlike {@link loadAllLinkingToEntity} this loads a single, known relationship
   * (e.g. the "Task" records whose `parentTask` is one of the given records)
   * and does so for many referenced entities at once.
   *
   * The field can be a plain entity-reference field (`dataType: "entity"`)
   * or hold embedded objects with references (e.g. the participants of attendance items).
   *
   * @param referencedIds The ids of the entities to find references to
   * @param refType The entity type of the entities to search for references
   * @param refProperty The field of refType that holds the reference
   * @param allEntities All entities of refType, if the caller already loaded them
   *          (e.g. to look up several levels of a hierarchy without loading the type again)
   * @returns A map of each referenced id that has any entity linking to it, to these linking entities.
   *          An entity referencing several of the given ids is listed for each of them.
   */
  async loadLinkingToEntities<T extends Entity = Entity>(
    referencedIds: string[],
    refType: EntityConstructor<T>,
    refProperty: string,
    allEntities?: T[],
  ): Promise<Map<string, T[]>> {
    const idsToFind = new Set(referencedIds);
    const field = refType.schema.get(refProperty);
    if (!field || idsToFind.size === 0) {
      return new Map();
    }

    const fieldConfig = { ...field, id: refProperty };
    const candidates =
      allEntities ??
      (field.dataType === EntityDatatype.dataType &&
      this.entityMapper.supportsFind(refType)
        ? await this.entityMapper.findAllType(
            refType,
            referencingAnyOf(refProperty, [...idsToFind]),
          )
        : await this.loadCandidates([...idsToFind], refType, [fieldConfig]));
    return groupByReferencedId(candidates, idsToFind, (entity) =>
      this.referencedIds(entity[refProperty], field),
    );
  }

  /**
   * The ids referenced in a field value: the plain id(s),
   * or the ids in the reference fields of embedded objects.
   */
  private referencedIds(value: unknown, field: EntitySchemaField): unknown[] {
    if (field.dataType === EntityDatatype.dataType) {
      return asArray(value);
    }
    const innerKeys = getEmbeddedEntityReferenceFields(
      this.schemaService,
      field,
    ).map(([key]) => key);
    return asArray(value).flatMap((item) =>
      innerKeys.length > 0 && typeof item === "object" && item !== null
        ? innerKeys.flatMap((key) => asArray(item[key]))
        : [item],
    );
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
      [primaryEntity.getId()],
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
   * The records of the given type that may reference one of the given ids.
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
  private async loadCandidates<T extends Entity>(
    referencedIds: string[],
    refType: EntityConstructor<T>,
    refProperties: FormFieldConfig[],
  ): Promise<T[]> {
    if (!this.entityMapper.supportsFind(refType)) {
      // a local database answers no queries, but its full load is cheap
      return this.entityMapper.loadType(refType);
    }

    const conditions: DataFilter<T>[] = [];
    for (const refProperty of refProperties) {
      const datatype = this.schemaService.getDatatypeOrDefault(
        refProperty.dataType,
      );
      const selectors = referencedIds.map((id) =>
        datatype.getReferenceSelector(refProperty.id, refProperty, id),
      );
      if (selectors.some((selector) => !selector?.length)) {
        Logging.debug(
          "loading all records of an entity type because a referencing field cannot be queried",
          { entityType: refType.ENTITY_TYPE, field: refProperty.id },
        );
        return this.entityMapper.loadType(refType);
      }
      conditions.push(...selectors.flat());
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

/**
 * The query for records whose field references any of the ids,
 * stored as a single id or as a list of ids: two conditions however many ids there are.
 */
function referencingAnyOf<T>(path: string, ids: string[]): DataFilter<T> {
  return {
    $or: [{ [path]: { $in: ids } }, { [path]: { $elemMatch: { $in: ids } } }],
  } as DataFilter<T>;
}

/**
 * Group the entities by which of the given ids their field references.
 * An entity referencing several of the ids is listed for each of them.
 */
function groupByReferencedId<T extends Entity>(
  entities: T[],
  ids: Set<string>,
  referencedIdsOf: (entity: T) => unknown[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entity of entities) {
    // a Set, so that an id referenced twice (e.g. by two embedded items) counts only once
    const referencedIds = new Set<unknown>(referencedIdsOf(entity));
    for (const id of referencedIds) {
      if (typeof id === "string" && ids.has(id)) {
        groups.set(id, [...(groups.get(id) ?? []), entity]);
      }
    }
  }
  return groups;
}
