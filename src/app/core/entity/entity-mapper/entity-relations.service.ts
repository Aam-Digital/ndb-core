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
  getSchemaEmbedDatatype,
  resolveEmbeddedField,
} from "../schema/embedded-schema-field.util";
import { getInnerEntityReferenceFields } from "../schema/entity-reference-fields";
import { referenceIdConditions } from "../default-datatype/default.datatype";
import { conditionOnEmbeddedField } from "../../filter/embedded-field-filter";
import { toStoredFormatCondition } from "../../filter/stored-format";
import { FilterService } from "../../filter/filter.service";
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
  private readonly filterService = inject(FilterService);

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
   * The condition that the field at the path (see {@link getReferencingFieldPaths}) links to the record with the id,
   * as the field currently stores it: in the field itself or in one of the entries of an embedded field.
   */
  referenceCondition(
    entityType: EntityConstructor,
    fieldPath: string,
    referencedId: string,
  ): DataFilter<any> {
    const field = this.filterService.getFieldAtPath(entityType, fieldPath);
    return this.filterService.toStoredCondition(entityType, {
      [fieldPath]: field?.isArray
        ? { $elemMatch: { $eq: referencedId } }
        : referencedId,
    });
  }

  /** ids of the inner fields of an embedded field linking to records of the type */
  private innerFieldsLinkingTo(
    field: EntitySchemaField,
    referencedType: string,
  ): string[] {
    return getEmbeddedEntityReferenceFields(this.schemaService, field)
      .filter(([, inner]) => isEntityLinkTo(inner, referencedType))
      .map(([innerId]) => innerId);
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
      const propertyConditions = this.referenceConditions(
        refType,
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
    return this.entityMapper.findAllType(
      refType,
      toStoredFormatCondition(
        { $or: conditions },
        refType.schema,
        this.schemaService,
      ),
    );
  }

  /**
   * The conditions that the given field of a record references the id, in any of the shapes it may be stored in,
   * also inside the entries of an embedded field.
   * `undefined` if the field's datatype does not hold the reference in a way a query can match.
   */
  private referenceConditions(
    refType: EntityConstructor,
    refProperty: FormFieldConfig,
    referencedId: string,
  ): DataFilter<any>[] | undefined {
    if (refProperty.dataType === EntityDatatype.dataType) {
      return referenceIdConditions(refProperty.id, referencedId);
    }

    const container = getSchemaEmbedDatatype(this.schemaService, refProperty);
    if (!container) {
      return undefined;
    }
    return getInnerEntityReferenceFields(
      container.getEffectiveSchema(refProperty),
    ).flatMap(([innerProp]) => {
      const fieldId = `${refProperty.id}.${innerProp}`;
      const condition = { $or: referenceIdConditions(fieldId, referencedId) };
      const embedded = resolveEmbeddedField(
        this.schemaService,
        refType,
        fieldId,
      );
      if (!embedded) {
        return condition.$or;
      }
      // records may have been saved while the field held a single object or a list of them
      return [true, false].flatMap((isArray) => {
        const onEmbeddedField = conditionOnEmbeddedField(condition, fieldId, {
          ...embedded,
          isArray,
        });
        return onEmbeddedField["$or"] ?? [onEmbeddedField];
      });
    });
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

/** whether the field links to records of the type */
function isEntityLinkTo(field: EntitySchemaField, type: string): boolean {
  return (
    field.dataType === EntityDatatype.dataType &&
    asArray(field.additional).includes(type)
  );
}
