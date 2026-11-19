import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../model/entity";
import { asArray } from "../../../utils/asArray";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import {
  getEmbeddedEntityReferenceFields,
  resolveEmbeddedField,
} from "../schema/embedded-schema-field.util";
import { referenceIdCondition } from "../default-datatype/default.datatype";
import { conditionOnEmbeddedField } from "../../filter/embedded-field-filter";
import { toStoredFormatCondition } from "../../filter/stored-format";
import { Logging } from "../../logging/logging.service";
import type { DataFilter } from "../../filter/filters/filters";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DatabaseIndexingService } from "../database-indexing/database-indexing.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { SessionSubject } from "../../session/auth/session-info";

/** fields of an entity type that another type links to (see {@link EntityRelationsService.getFieldsOfLinkedTypes}) */
export interface LinkedTypeFields {
  /** id of the field linking to the type */
  linkId: string;
  link: EntitySchemaField;
  linkedType: EntityConstructor;
  /** the matching fields of the linked type, as [id, schema] */
  fields: [string, EntitySchemaField][];
}

/** the property of an entity that a reference index can be created for */
type IndexedProperty = Parameters<
  DatabaseIndexingService["generateIndexOnProperty"]
>[2];

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
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly ability = inject(EntityAbility, { optional: true });
  private readonly sessionInfo = inject(SessionSubject, { optional: true });

  /** ids of the reference indexes that were already requested in this session */
  private readonly requestedReferenceIndexes = new Set<string>();

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
   * The fields of the entity type that link to records of the referenced type, as paths:
   * the id of a field linking to a record, or `<field>.<inner field>` for the link inside the entries
   * of an embedded field (e.g. "attendance.participant").
   */
  getReferencingFieldPaths(
    entityType: EntityConstructor,
    referencedType: string,
  ): string[] {
    return [...entityType.schema].flatMap(([fieldId, field]) =>
      isEntityLinkTo(field, referencedType)
        ? [fieldId]
        : this.innerFieldsLinkingTo(field, referencedType).map(
            (innerId) => `${fieldId}.${innerId}`,
          ),
    );
  }

  /**
   * The path of a field linking to records of the referenced type, for a field given by its id alone:
   * an embedded field with one inner field linking to that type is resolved to the path of that inner field
   * (e.g. "attendance" to "attendance.participant").
   */
  resolveReferencingFieldPath(
    entityType: EntityConstructor,
    fieldPath: string,
    referencedType: string,
  ): string {
    const field = entityType.schema.get(fieldPath);
    if (!field) {
      return fieldPath;
    }
    const innerIds = this.innerFieldsLinkingTo(field, referencedType);
    return innerIds.length === 1 ? `${fieldPath}.${innerIds[0]}` : fieldPath;
  }

  /**
   * The conditions (to combine with `$or`) that the field at the path (see {@link getReferencingFieldPaths})
   * links to one of the records with the ids, in any of the shapes it may be stored in:
   * a single id or a list of them, and for a field inside the entries of an embedded field,
   * a list of entries or a single one (saved while the field had the other setting).
   */
  referenceConditions(
    entityType: EntityConstructor,
    fieldPath: string,
    referencedIds: string[],
  ): DataFilter<Entity>[] {
    const condition = referenceIdCondition(fieldPath, referencedIds);
    const embedded = resolveEmbeddedField(
      this.schemaService,
      entityType,
      fieldPath,
    );
    if (!embedded) {
      return [condition];
    }
    return [true, false].flatMap((isArray) => {
      const onEmbeddedField = conditionOnEmbeddedField(condition, fieldPath, {
        ...embedded,
        isArray,
      });
      return onEmbeddedField["$or"] ?? [onEmbeddedField];
    });
  }

  /** ids of the inner fields of an embedded field linking to records of the type */
  private innerFieldsLinkingTo(
    field: EntitySchemaField | undefined,
    referencedType: string,
  ): string[] {
    return getEmbeddedEntityReferenceFields(this.schemaService, field)
      .filter(([, inner]) => isEntityLinkTo(inner, referencedType))
      .map(([innerId]) => innerId);
  }

  /**
   * Check whether a schema field references (any of) the given entity types,
   * including nested references inside embedded schemas (e.g. attendance fields).
   */
  fieldReferencesType(
    field: EntitySchemaField | undefined,
    types: string[],
  ): boolean {
    return types.some(
      (type) =>
        asArray(field?.additional).includes(type) ||
        this.innerFieldsLinkingTo(field, type).length > 0,
    );
  }

  /**
   * The records referencing the given entity, each with its fields that reference it.
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
   * The field can be a plain entity-reference field or hold embedded objects
   * with references (e.g. the participants of attendance items).
   *
   * Only the records needed are loaded, where possible:
   * - through a database query, if the database answers queries (online-only)
   *   (all records of the type are loaded instead if the query fails);
   * - through a database index of the field, on a local database
   *   (all records of the type are loaded instead if the index cannot be used);
   * - all records of the type for a visitor without an account (public forms),
   *   whom the server does not let query indexes.
   *
   * @returns A map of each referenced id that has any entity linking to it, to these linking entities.
   *          An entity referencing several of the given ids is listed for each of them.
   *          Empty if the user may not read the entity type.
   */
  async loadLinkingToEntities<T extends Entity = Entity>(
    referencedIds: string[],
    refType: EntityConstructor<T>,
    refProperty: string,
  ): Promise<Map<string, T[]>> {
    const ids = new Set(referencedIds);
    const field = refType.schema.get(refProperty);
    if (!field || ids.size === 0 || !this.canRead(refType)) {
      return new Map();
    }

    const candidates = await this.loadCandidatesForField([...ids], refType, {
      ...field,
      id: refProperty,
    });
    const innerKeys = this.innerReferenceKeys(field);
    return groupByReferencedId(candidates, ids, (entity) =>
      referencedIdsIn(entity[refProperty], innerKeys),
    );
  }

  /**
   * The records of the type that may reference one of the ids in the one field
   * (like {@link loadCandidates} for several fields, see {@link loadLinkingToEntities} for how they are loaded).
   */
  private async loadCandidatesForField<T extends Entity>(
    ids: string[],
    refType: EntityConstructor<T>,
    field: FormFieldConfig,
  ): Promise<T[]> {
    if (this.sessionInfo && !this.sessionInfo.value) {
      return this.entityMapper.loadType(refType);
    }
    if (
      !this.entityMapper.supportsFind(refType) &&
      field.dataType === EntityDatatype.dataType
    ) {
      return this.loadThroughReferenceIndex(refType, field.id, ids);
    }
    return this.loadCandidates(ids, refType, [field]);
  }

  /**
   * The records referencing one of the ids through the reference index of the field
   * (created on first use), or all records of the type if the index cannot be used.
   */
  private async loadThroughReferenceIndex<T extends Entity>(
    refType: EntityConstructor<T>,
    property: string,
    ids: string[],
  ): Promise<T[]> {
    const indexId = `linking_${refType.ENTITY_TYPE}_${property}`;
    let records: T[];
    try {
      if (!this.requestedReferenceIndexes.has(indexId)) {
        this.requestedReferenceIndexes.add(indexId);
        await this.dbIndexing.generateIndexOnProperty(
          indexId,
          refType,
          property as IndexedProperty,
        );
      }
      records = await this.dbIndexing.queryIndexDocs(
        refType,
        `${indexId}/by_${property}`,
        { keys: ids },
      );
    } catch (error) {
      // only a local database gets here, where the index should always work
      Logging.warn(
        "EntityRelationsService: Could not use the index of linked records, loading all records of the type instead",
        error,
        { entityType: refType.ENTITY_TYPE, field: property },
      );
      return this.entityMapper.loadType(refType);
    }
    // a record referencing several of the ids is returned once for each of them
    return [...new Map(records.map((r) => [r.getId(), r])).values()];
  }

  /** The inner reference properties of an embedded field, empty for other fields. */
  private innerReferenceKeys(field: EntitySchemaField | undefined): string[] {
    if (field?.dataType === EntityDatatype.dataType) {
      return [];
    }
    return getEmbeddedEntityReferenceFields(this.schemaService, field).map(
      ([key]) => key,
    );
  }

  /**
   * Whether the user may read records of the type.
   * Until the permissions are loaded, this is not known (the server checks them anyway).
   */
  private canRead(entityType: EntityConstructor): boolean {
    return !this.ability?.initialized || this.ability.can("read", entityType);
  }

  /**
   * The records of the type referencing the primary entity through one of the given fields (of the type's schema).
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
   * matches too much is harmless. If the query fails, the whole type is loaded as well.
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

    const conditions: DataFilter<Entity>[] = [];
    for (const refProperty of refProperties) {
      const propertyConditions = this.fieldReferenceConditions(
        refType,
        refProperty,
        referencedIds,
      );

      if (propertyConditions.length === 0) {
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
    try {
      return await this.entityMapper.findAllType(
        refType,
        toStoredFormatCondition(
          { $or: conditions },
          refType.schema,
          this.schemaService,
        ) as DataFilter<T>,
      );
    } catch (error) {
      // a failure of the user's environment (e.g. offline) is logged at debug by Logging itself
      Logging.warn(
        "EntityRelationsService: Could not query the linked records, loading all records of the type instead",
        error,
        {
          entityType: refType.ENTITY_TYPE,
          fields: refProperties.map((p) => p.id),
        },
      );
      return this.entityMapper.loadType(refType);
    }
  }

  /**
   * The conditions that the given field of a record references one of the ids, in any of the shapes it may be stored in,
   * also inside the entries of an embedded field.
   * None if the field's datatype does not hold the reference in a way a query can match.
   */
  private fieldReferenceConditions(
    refType: EntityConstructor,
    refProperty: FormFieldConfig,
    referencedIds: string[],
  ): DataFilter<Entity>[] {
    const paths =
      refProperty.dataType === EntityDatatype.dataType
        ? [refProperty.id]
        : this.innerReferenceKeys(refProperty).map(
            (innerProp) => `${refProperty.id}.${innerProp}`,
          );
    return paths.flatMap((path) =>
      this.referenceConditions(refType, path, referencedIds),
    );
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
    item: unknown,
    refId: string,
    field?: EntitySchemaField,
  ): boolean {
    return referencedIdsIn(item, this.innerReferenceKeys(field)).includes(
      refId,
    );
  }

  /**
   * The fields of the entity (out of the relevant ones) that contain the id.
   */
  private fieldsIncludingId(
    entity: Entity,
    refId: string,
    relevantFields: FormFieldConfig[],
  ): FormFieldConfig[] {
    return relevantFields.filter((field) =>
      referencedIdsIn(
        entity[field.id],
        this.innerReferenceKeys(field),
      ).includes(refId),
    );
  }
}

/** whether the field links to records of the type */
function isEntityLinkTo(field: EntitySchemaField, type: string): boolean {
  return (
    field.dataType === EntityDatatype.dataType &&
    asArray(field.additional).includes(type)
  );
}

/**
 * The ids a field value references: the plain id(s), or for embedded objects the ids
 * in their inner reference properties (all their values, if `innerKeys` is empty).
 */
function referencedIdsIn(value: unknown, innerKeys: string[]): unknown[] {
  return asArray(value).flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [item];
    }
    return innerKeys.length > 0
      ? innerKeys.flatMap((key) => asArray(item[key]))
      : Object.values(item);
  });
}

/**
 * Group the entities by which of the given ids they reference.
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
    for (const id of new Set<unknown>(referencedIdsOf(entity))) {
      if (typeof id === "string" && ids.has(id)) {
        if (!groups.has(id)) {
          groups.set(id, []);
        }
        groups.get(id).push(entity);
      }
    }
  }
  return groups;
}
