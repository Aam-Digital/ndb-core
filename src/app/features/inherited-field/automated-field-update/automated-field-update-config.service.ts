import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AffectedRule,
  CommonValueOfParents,
  EnteredValue,
  UpdateTrigger,
} from "./automated-field-update.types";
import { lastValueFrom } from "rxjs";
import { DefaultValueConfigInheritedField } from "../inherited-field-config";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { asArray } from "#src/app/utils/asArray";
import { addMissingValues } from "../add-missing-values";
import { CommonValue, getCommonValue, isSameValue } from "../get-common-value";
import { ChangeSet, getChangedFields } from "./change-set";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import {
  AffectedEntitiesCalculation,
  AffectedEntitiesContext,
  QueuedChange,
} from "./affected-entities-calculation";

/** the property of an entity that a reference index can be created for */
type IndexedProperty = Parameters<
  DatabaseIndexingService["generateIndexOnProperty"]
>[2];

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedFieldUpdateConfigService implements AffectedEntitiesContext {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly dialog = inject(MatDialog);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly ability = inject(EntityAbility, { optional: true });

  /** ids of the reference indexes that were already requested in this session */
  private readonly requestedReferenceIndexes = new Set<string>();

  /**
   * Track processed entity revisions to prevent duplicate automated status updates within the same save operation
   */
  private readonly processedRevisions = new Set<string>();

  /**
   * Applies rules to dependent entities based on changes in the provided entities.
   * Also prompts user confirmation and saves updates if any changes were made.
   * Several changed entities (e.g. of a bulk edit) are covered together in one dialog.
   * @param entities - The source entities whose changes should trigger updates
   * @param entitiesBeforeChanges The state of the entities before changes were applied to identify what has changed
   *   (in the same order)
   * @return the updated entities as they were before the update (to undo it), without the given entities themselves
   */
  public async applyRulesToDependentEntities(
    entities: Entity | Entity[],
    entitiesBeforeChanges: Entity | Entity[],
  ): Promise<Entity[]> {
    const before = asArray(entitiesBeforeChanges);
    // only the entities with a change that is passed on (saving also changes e.g. the update time)
    const triggers = asArray(entities)
      .map((entity, i) => ({ entity, before: before[i] }))
      .filter(
        ({ entity, before }) =>
          this.getTriggeredRules(entity, {
            entity,
            level: 0,
            changedFields: getChangedFields(entity, before),
          }).length > 0 && !this.checkRefAlreadyProcessed(entity),
      );
    if (triggers.length === 0) return [];

    const { previousVersions } =
      await this.confirmAndSaveAffectedEntities(triggers);
    return previousVersions;
  }

  /**
   * Whether the given field of the entity is passed on to other entities that the entity links to
   * by an automation rule (e.g. a sub-item's field that updates its linked parent).
   */
  public hasLinkedRecordsToUpdate(entity: Entity, fieldId: string): boolean {
    return (
      !entity.isNew &&
      this.getRulesUsingFieldAsSource(entity.getConstructor(), fieldId).some(
        ({ rule }) => asArray(entity[rule.sourceReferenceField] ?? []).length,
      )
    );
  }

  /**
   * Open the dialog to update the entities linked by the given entity with the value of the given field,
   * regardless of whether the field was changed recently.
   * @return whether there were any linked entities to update
   */
  public async updateLinkedRecords(
    entity: Entity,
    fieldId: string,
  ): Promise<boolean> {
    const { hasAffectedEntities } = await this.confirmAndSaveAffectedEntities([
      { entity, before: entity, fieldId },
    ]);
    return hasAffectedEntities;
  }

  /**
   * Find the entities that the rules would update, level by level up the hierarchy
   * (see {@link AffectedEntitiesCalculation}).
   * @param triggers the changes that start the update
   * @param enteredValues values the user entered for affected entities (database format),
   *   which the entities above are based on instead of the suggestions
   * @return the affected entities, ordered by level
   */
  private findAffectedEntities(
    triggers: UpdateTrigger[],
    enteredValues: EnteredValue[] = [],
  ): Promise<AffectedEntity[]> {
    return new AffectedEntitiesCalculation(this, triggers, enteredValues).run();
  }

  /**
   * The rules that pass on the changed fields of the source entity.
   */
  public getTriggeredRules(
    source: Entity,
    { changedFields, onlyLinkedEntities }: QueuedChange,
  ): AffectedRule[] {
    const isChanged = (fieldId: string) => changedFields.includes(fieldId);
    const directRules = this.getInheritanceRulesFromDirectEntity(
      source.getConstructor(),
    ).filter(
      ({ rule }) =>
        isChanged(rule.sourceValueField) ||
        isChanged(rule.sourceReferenceField),
    );
    const indirectRules = onlyLinkedEntities
      ? []
      : this.getInheritanceRulesReferencingThisEntity(
          source.getConstructor(),
        ).filter(({ rule }) => isChanged(rule.sourceValueField));
    return [...directRules, ...indirectRules];
  }

  /**
   * Whether the user may change the field of the entity.
   * Until the permissions are loaded, this is not known (the server checks them anyway).
   */
  public canUpdate(entity: Entity, fieldId: string): boolean {
    return (
      !this.ability?.initialized || this.ability.can("update", entity, fieldId)
    );
  }

  private getRulesUsingFieldAsSource(
    entityType: EntityConstructor,
    fieldId: string,
  ): AffectedRule[] {
    return this.getInheritanceRulesFromDirectEntity(entityType).filter(
      ({ rule }) => rule.sourceValueField === fieldId,
    );
  }

  /**
   * skip if already processed this specific entity revision
   * Note views can otherwise open multiple overlapping dialogs (because the note-details component contains three components, all sharing the same form instance)
   */
  private checkRefAlreadyProcessed(entity: Entity): boolean {
    const entityKey = `${entity.getId()}-${entity._rev}`;
    const alreadyProcessed = this.processedRevisions.has(entityKey);
    this.processedRevisions.add(entityKey);
    return alreadyProcessed;
  }

  /**
   * Find all Inheritance Rules on other entity types that list the given sourceReferenceEntity.
   *
   * For example:
   * Given the method parameter sourceReferenceEntity = School
   * Return any Rule in Child entity type, which refers to sourceReferenceEntity = School
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesFromDirectEntity(
    sourceReferenceEntity: EntityConstructor,
  ): AffectedRule[] {
    return this.getAllRules().filter(
      ({ rule }) =>
        rule?.sourceReferenceEntity === sourceReferenceEntity.ENTITY_TYPE,
    );
  }

  /**
   * Find all Inheritance Rules where the sourceReferenceField's entity type (in "additional") matches the given sourceReferenceEntity.
   *
   * For example:
   * Given the method parameter sourceReferenceEntity = School
   * Return any Rule in Child entity type, which has an undefined sourceReferenceEntity
   *      and the sourceReferenceField (on the Child entity) has an "additional" = School dataType
   * (as well as any other such rule in any entity type)
   */
  private getInheritanceRulesReferencingThisEntity(
    sourceReferenceEntity: EntityConstructor,
  ): AffectedRule[] {
    return this.getAllRules().filter(({ rule, entityType }) => {
      // For inheritance rules: sourceReferenceEntity is undefined
      if (rule?.sourceReferenceEntity || !rule?.sourceReferenceField) {
        return false;
      }

      // Check if the sourceReferenceField is configured to reference our entity type
      const referenceFieldConfig = entityType.schema.get(
        rule.sourceReferenceField,
      );
      return (
        referenceFieldConfig?.dataType === "entity" &&
        referenceFieldConfig?.additional === sourceReferenceEntity.ENTITY_TYPE
      );
    });
  }

  /**
   * Get the inheritance and automation rules defined in the field schemas of all entity types.
   */
  private getAllRules(): AffectedRule[] {
    return [...this.entityRegistry.values()].flatMap((entityType) =>
      [...entityType.schema.entries()]
        .filter(([, field]) => field.defaultValue?.mode === "inherited-field")
        .map(([fieldId, field]) => ({
          rule: field.defaultValue.config as DefaultValueConfigInheritedField,
          entityType,
          fieldId,
        })),
    );
  }

  /** The value of the field of the entity in database format */
  public getDatabaseValue(entity: Entity, fieldId: string): any {
    return this.transformSourceValueToDatabaseFormat(
      entity[fieldId],
      entity,
      fieldId,
      this.entitySchemaService,
    );
  }

  /** A value of a field of the entity type, converted from database format to entity format */
  public toEntityFormat(
    value: unknown,
    entityType: EntityConstructor,
    fieldId: string,
  ): unknown {
    return this.entitySchemaService.valueToEntityFormat(value, {
      ...entityType.schema.get(fieldId),
      id: fieldId,
    });
  }

  /**
   * Calculate the new value from source entity with value mapping applied.
   * Transforms to database format for consistent handling of all datatypes.
   * @param sourceEntity The entity containing the source value
   * @param rule The inheritance rule configuration
   */
  public calculateNewValue(
    sourceEntity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): any {
    const sourceValue = this.transformSourceValueToDatabaseFormat(
      sourceEntity?.[rule.sourceValueField],
      sourceEntity,
      rule.sourceValueField,
      this.entitySchemaService,
    );

    if (!rule.valueMapping) {
      return sourceValue;
    }

    const mapValue = (value: string) => rule.valueMapping[value] ?? value;
    // flatMap: mapped values are arrays if the target field is multi-select
    return Array.isArray(sourceValue)
      ? [...new Set(sourceValue.flatMap(mapValue))]
      : mapValue(sourceValue);
  }

  /**
   * Calculate the new value that all given source entities have in common
   * (see {@link calculateNewValue}), ignoring empty values.
   */
  public calculateCommonValue(
    sourceEntities: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): CommonValue {
    return getCommonValue(
      sourceEntities.map((entity) => this.calculateNewValue(entity, rule)),
    );
  }

  /**
   * Load the linked parent records and get the value they all have in common
   * (see {@link calculateCommonValue}).
   * If any of them cannot be loaded (e.g. the user has no permission to read it), no common value can be determined.
   * @param parentIds The ids of the linked parent records to load
   * @param rule The inheritance rule
   * @param options.parentType The entity type of the parent records
   *   (ids of other types are not loaded, ids without type prefix are loaded as this type);
   *   if not given, each record is loaded as the type of its id prefix
   * @param options.loadedParents Further linked parents that are already loaded (not in parentIds)
   * @param options.changeSet Changes that are not saved yet, used instead of the saved records
   */
  public async loadCommonValue(
    parentIds: string[],
    rule: DefaultValueConfigInheritedField,
    options: {
      parentType?: EntityConstructor;
      loadedParents?: Entity[];
      changeSet?: ChangeSet;
    } = {},
  ): Promise<CommonValueOfParents> {
    const loaded = await this.loadEntitiesByIds(options.parentType, parentIds);
    // without all linked parents available, no shared value can be determined
    if (loaded.length !== parentIds.length) {
      return { noCommonValue: "unavailable" };
    }

    const parents = options.changeSet
      ? loaded.map((parent) => options.changeSet.get(parent, "after"))
      : loaded;
    const commonValue = this.calculateCommonValue(
      [...(options.loadedParents ?? []), ...parents],
      rule,
    );
    return commonValue.isConflict
      ? { noCommonValue: "conflict" }
      : { value: commonValue.value };
  }

  /**
   * Collect the values of all records that link to the given entity as defined by the automation rule
   * (e.g. the cities of all children linking to a school), skipping duplicates.
   * @param entity The record that the related records link to
   * @param rule The automation rule (with sourceReferenceEntity)
   * @return the combined values in database format
   */
  public async collectValuesOfLinkedRecords(
    entity: Entity,
    rule: DefaultValueConfigInheritedField,
  ): Promise<any[]> {
    return this.collectValues(
      await this.loadRecordsLinkingTo(
        rule.sourceReferenceEntity,
        rule.sourceReferenceField,
        entity.getId(),
      ),
      rule,
    );
  }

  /** The values of the given records as defined by the automation rule, skipping duplicates (database format). */
  public collectValues(
    records: Entity[],
    rule: DefaultValueConfigInheritedField,
  ): any[] {
    return records.reduce(
      (values, record) =>
        addMissingValues(values, this.calculateNewValue(record, rule)),
      [],
    );
  }

  /**
   * Load the records of the given type that reference the given entity in the given field
   * (a single reference or a list of references) through a database index,
   * instead of loading and checking all records of the type.
   * If the index cannot be used (e.g. it cannot be created in online-only mode),
   * all records of the type are loaded and checked instead.
   */
  public async loadRecordsLinkingTo(
    entityType: string | EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]> {
    const ctor =
      typeof entityType === "string"
        ? this.entityRegistry.get(entityType)
        : entityType;
    if (!ctor?.schema.has(referenceField)) {
      return [];
    }

    try {
      return await this.queryLinkingRecordsIndex(
        ctor,
        referenceField,
        entityId,
      );
    } catch (error) {
      Logging.warn(
        "AutomatedFieldUpdateConfigService: Could not use the index of linked records, loading all records of the type instead",
        { entityType: ctor.ENTITY_TYPE, referenceField },
        error,
      );
      return (await this.entityMapper.loadType(ctor)).filter((record) =>
        asArray(record[referenceField]).includes(entityId),
      );
    }
  }

  private async queryLinkingRecordsIndex(
    ctor: EntityConstructor,
    referenceField: string,
    entityId: string,
  ): Promise<Entity[]> {
    const indexId = `linking_${ctor.ENTITY_TYPE}_${referenceField}`;
    if (!this.requestedReferenceIndexes.has(indexId)) {
      this.requestedReferenceIndexes.add(indexId);
      // the query below waits until the index is ready
      this.dbIndexing
        .generateIndexOnProperty(
          indexId,
          ctor,
          referenceField as IndexedProperty,
        )
        .catch((error) =>
          Logging.warn(
            "AutomatedFieldUpdateConfigService: Could not create the index of linked records",
            { indexId },
            error,
          ),
        );
    }

    return this.dbIndexing.queryIndexDocs(
      ctor,
      `${indexId}/by_${referenceField}`,
      entityId,
    );
  }

  /**
   * Transform a source field value to database format for inherited field operations.
   * This finds the field schema from the source entity and applies the transformation.
   *
   * @param value The value to transform
   * @param sourceEntity The entity containing the value
   * @param sourceFieldId The field ID where the value comes from
   * @param entitySchemaService The schema service for transformations
   */
  public transformSourceValueToDatabaseFormat(
    value: any,
    sourceEntity: Entity,
    sourceFieldId: string,
    entitySchemaService: EntitySchemaService,
  ): any {
    if (value === null || value === undefined) {
      return value;
    }

    const sourceFieldConfig = sourceEntity
      .getConstructor()
      .schema.get(sourceFieldId);

    if (!sourceFieldConfig) {
      return value;
    }

    return entitySchemaService.valueToDatabaseFormat(
      value,
      sourceFieldConfig,
      sourceEntity,
    );
  }

  /**
   * Load entities by their IDs, skipping those that cannot be loaded.
   * @param entityType The type of entities to load (ids of other types are skipped);
   *   if undefined, each entity is loaded as the type of its id prefix
   * @param entityIds
   */
  public async loadEntitiesByIds(
    entityType: EntityConstructor | undefined,
    entityIds: string[],
  ): Promise<Entity[]> {
    // The reference field can hold ids of several entity types. Ids without any type prefix
    // are still loaded, because the mapper adds the prefix of the given type itself.
    const idsToLoad = entityType
      ? entityIds.filter(
          (id) =>
            String(id).startsWith(`${entityType.ENTITY_TYPE}:`) ||
            !String(id).includes(":"),
        )
      : entityIds;

    const loadedEntities = await Promise.all(
      idsToLoad.map((id) => this.loadEntity(id, entityType)),
    );

    return loadedEntities.filter((entity) => entity);
  }

  /**
   * Load an entity, logging why it could not be loaded.
   * @param entityId
   * @param entityType The type of the entity; if not given, the type of the id prefix
   * @return the entity, or undefined if it could not be loaded
   */
  private async loadEntity(
    entityId: string,
    entityType?: EntityConstructor,
  ): Promise<Entity | undefined> {
    try {
      return await this.entityMapper.load(
        entityType ?? Entity.extractTypeFromId(entityId),
        entityId,
      );
    } catch (error) {
      const context = { entityType: entityType?.ENTITY_TYPE, entityId };
      const status = error?.["status"] ?? error?.["statusCode"];
      if (status === 401 || status === 403) {
        // the user simply has no read access to the linked entity - expected for some roles
        Logging.debug(
          "AutomatedFieldUpdateConfigService: No permission to load linked entity",
          context,
          error,
        );
      } else {
        Logging.warn(
          "AutomatedFieldUpdateConfigService: Failed to load linked entity",
          context,
          error,
        );
      }
      return undefined;
    }
  }

  /**
   * Find the entities affected by the change and open a dialog to confirm their updates with the user.
   * Saves entities only if the user confirms the changes.
   * @return whether there were any affected entities, and the saved entities as they were before (to undo the update)
   */
  private async confirmAndSaveAffectedEntities(
    triggers: UpdateTrigger[],
  ): Promise<{ hasAffectedEntities: boolean; previousVersions: Entity[] }> {
    const affectedEntities = await this.findAffectedEntities(triggers);
    if (affectedEntities.length === 0) {
      return { hasAffectedEntities: false, previousVersions: [] };
    }

    const userConfirmed = await this.showConfirmationDialog(
      affectedEntities,
      triggers,
    );
    if (!userConfirmed) {
      return { hasAffectedEntities: true, previousVersions: [] };
    }

    // Todo: Currently if there are multiple rule set for same entity and field, we are showing in UI as multiple entries,
    // we need a proper UI to show the same entity and field with multiple values
    const updatesByEntityId = new Map<string, AffectedEntity[]>();
    userConfirmed.forEach((update) => {
      const existing = updatesByEntityId.get(update.id) || [];
      existing.push(update);
      updatesByEntityId.set(update.id, existing);
    });

    const entitiesToSave: Entity[] = [];
    const previousVersions: Entity[] = [];
    updatesByEntityId.forEach((updates) => {
      const entity = updates[0].affectedEntity;
      // e.g. records only listed to note that their linked records have no value in common
      const changes = updates.filter(
        (update) => entity && !isSameValue(update.newValue, update.savedValue),
      );
      if (changes.length > 0) {
        // the caller has the changed entities themselves as they were before their change
        if (!triggers.some((t) => t.entity.getId() === entity.getId())) {
          previousVersions.push(entity.copy());
        }
        changes.forEach((update) => {
          entity[update.targetFieldId] =
            this.entitySchemaService.valueToEntityFormat(
              update.newValue,
              update.selectedField,
            );
        });
        entitiesToSave.push(entity);
      }
    });

    // together, so that none of them is saved if the user may not save one of them
    await this.entityMapper.saveAll(entitiesToSave);
    return { hasAffectedEntities: true, previousVersions };
  }

  /**
   * Opens the confirmation dialog to let user to approve or update the changes.
   * @param entitiesToUpdate - List of entities with pending updates
   */
  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
    triggers: UpdateTrigger[],
  ): Promise<AffectedEntity[] | null> {
    // loaded lazily to avoid a circular import (dialog -> field edit -> inherited value button -> this service)
    const { AutomatedFieldUpdateComponent } =
      await import("./automated-field-update.component");
    const dialogRef = this.dialog.open(AutomatedFieldUpdateComponent, {
      maxHeight: "90vh",
      data: {
        entities: entitiesToUpdate,
        triggers,
        recalculate: (enteredValues: EnteredValue[]) =>
          this.findAffectedEntities(triggers, enteredValues),
      },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }
}
