import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AffectedEntity,
  AutomatedStatusUpdateComponent,
} from "./automated-status-update.component";
import { lastValueFrom } from "rxjs";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";
import { ConfigService } from "app/core/config/config.service";
import { DefaultValueConfigInheritedField } from "../inherited-field/inherited-field-config";

/**
 * Service to automatically update related entities based on configured rules.
 * It finds dependent entities and updates their fields based on changes in the source entity.
 */
@Injectable({ providedIn: "root" })
export class AutomatedStatusUpdateConfigService {
  private entityRegistry = inject(EntityRegistry);
  private entityMapper = inject(EntityMapperService);
  private dialog = inject(MatDialog);
  private unsavedChangesService = inject(UnsavedChangesService);
  private entitySchemaService = inject(EntitySchemaService);
  private configService = inject(ConfigService);

  /**
   * Track processed entity revisions to prevent duplicate automated status updates within the same save operation
   */
  private readonly processedRevisions = new Set<string>();

  /**
   * List of entities impacted by automated status updates.
   * For example, if a field in the "Schools" entity is linked to a field in the "Child" entity,
   * and the field in "Schools" (trigger field) is updated, the "Child" entity will be affected.
   * The IDs of the affected "Child" entities will be stored in this list.
   */
  relatedEntities: Entity[] = [];

  /**
   * The relatedReferenceField configuration, which is used to show the label of related reference field in dialog.
   */
  relatedReferenceFieldConfig: EntitySchemaField;

  /**
   * A map that tracks dependencies between entities and their fields for automated status updates.
   * - Key: A unique identifier in the format "entityType|fieldId" (e.g., "School|schoolStatus").
   * - Value: An array of rules that define how changes in the specified field affect related entities and fields.
   *
   * This map is used to determine which entities and fields need to be updated automatically
   * when a specific field in a source entity changes.
   */
  private dependencyMap = new Map<
    string,
    {
      targetEntityType: EntityConstructor;
      targetFieldId: string;
      relatedReferenceField: string;
      rule: DefaultValueConfigInheritedField;
    }[]
  >();

  constructor() {
    this.configService.configUpdates.subscribe(() =>
      // wait until EntityConfigService has updated the entityRegistry
      setTimeout(() => this.buildDependencyMap()),
    );
  }

  /**
   * Builds a map of dependent field rules from entity schema config
   * to be used during automatic updates.
   */
  private buildDependencyMap() {
    this.dependencyMap.clear();
    for (const targetType of this.entityRegistry.values()) {
      for (const [fieldKey, fieldConfig] of targetType.schema.entries()) {
        this.processFieldConfig(targetType, fieldKey, fieldConfig);
      }
    }
  }

  /**
   * Processes a single field configuration to extract automated rules
   */
  private processFieldConfig(
    targetType: EntityConstructor,
    fieldKey: string,
    fieldConfig: EntitySchemaField,
  ) {
    const rule = fieldConfig.defaultValue?.config;
    if (fieldConfig.defaultValue?.mode === "inherited-field" && rule) {
      this.processAutomatedRule(targetType, fieldKey, rule);
    }
  }

  /**
   * Processes a single automation rule and adds it to the dependency map
   * @param targetEntityType - Type of entity that contains the rule
   * @param targetFieldId - Field ID where the rule is defined
   * @param rule - Automation rule configuration
   */
  private processAutomatedRule(
    targetEntityType: EntityConstructor,
    targetFieldId: string,
    rule: DefaultValueConfigInheritedField,
  ) {
    const key = `${rule.sourceEntityType}|${rule.sourceValueField}`;
    const entry = {
      targetEntityType: targetEntityType,
      targetFieldId: targetFieldId,
      relatedReferenceField: rule.sourceReferenceField,
      rule: rule,
    };

    const existingEntries = this.dependencyMap.get(key) || [];
    this.dependencyMap.set(key, [...existingEntries, entry]);
  }

  /**
   * Retrieves all automated rules for a given source entity field.
   * @param sourceEntityType - The entity type of the source
   * @param changedField - The changed field in the source entity
   */
  public findEntitiesDependingOnField(
    sourceEntityType: string,
    changedField: string,
  ) {
    return this.dependencyMap.get(`${sourceEntityType}|${changedField}`) || [];
  }

  /**
   * Applies rules to dependent entities based on changes in the provided entity.
   * Also prompts user confirmation and saves updates if any changes were made.
   * @param entity - The source entity whose changes should trigger updates
   * @param entityBeforeChanges The state of the entity before changes were applied to identify what has changed
   */
  public async applyRulesToDependentEntities(
    entity: Entity,
    entityBeforeChanges: Entity,
  ): Promise<void> {
    // skip if already processed this specific entity revision
    // Note views can otherwise open multiple overlapping dialogs (because the note-details component contains three components, all sharing the same form instance)
    const entityKey = `${entity.getId()}-${entity._rev}`;
    if (this.processedRevisions.has(entityKey)) {
      return;
    }
    this.processedRevisions.add(entityKey);

    const affectedEntities: AffectedEntity[] = [];
    const changedFields = this.getChangedFields(entity, entityBeforeChanges);
    await this.applyFieldMappings(changedFields, entity, affectedEntities);

    if (affectedEntities.length > 0) {
      await this.confirmAndSaveAffectedEntities(affectedEntities);
    }
  }

  /**
   * Analyze which fields changed during the current editing.
   * @param newEntity Updated entity after saving
   * @param originalEntity Entity before changes were applied
   * @return List of key-value pairs of all changed fields (field ID and new value in that field)
   * @private
   */
  private getChangedFields(
    newEntity: Entity,
    originalEntity: Entity,
  ): [string, any][] {
    const changedFields: [string, any][] = [];

    for (const [key] of originalEntity.getSchema().entries()) {
      if (
        JSON.stringify(originalEntity[key]) !== JSON.stringify(newEntity[key])
      ) {
        changedFields.push([key, newEntity[key]]);
      }
    }

    return changedFields;
  }

  /**
   * Iterates through changed fields and applies mappings to relevant dependent entities
   * @param changedFields - List of changed fields with their values
   * @param entity - The source entity containing changes
   * @param affectedEntities - Array to collect affected entity changes
   */
  private async applyFieldMappings(
    changedFields: [string, any][],
    entity: Entity,
    affectedEntities: AffectedEntity[],
  ): Promise<void> {
    for (const [changedField, changedValue] of changedFields) {
      const affectedRecords = this.findEntitiesDependingOnField(
        entity.getType(),
        changedField,
      );
      for (const affected of affectedRecords) {
        if (changedField == affected.rule.sourceValueField) {
          await this.applyMappingToAffectedRecord(
            entity,
            affected,
            changedValue,
            affectedEntities,
          );
        }
      }
    }
  }

  /**
   * Applies field mapping rule to a single affected record
   * @param sourceEntity - Entity where change occurred
   * @param affected - Configuration for the affected entity/field
   * @param changedValue - New value from source field
   * @param affectedEntities - Array to collect resulting changes
   */
  private async applyMappingToAffectedRecord(
    sourceEntity: Entity,
    affected: any,
    changedValue: any,
    affectedEntities: AffectedEntity[],
  ): Promise<void> {
    const entity = sourceEntity[affected.relatedReferenceField];
    this.relatedReferenceFieldConfig = sourceEntity
      .getSchema()
      .get(affected.relatedReferenceField);
    if (!entity) return;
    const newValue = affected.rule.valueMapping[changedValue.id];
    const loadedEntities = await this.loadRelatedEntities(
      entity,
      affected.targetEntityType,
    );

    for (const targetEntity of loadedEntities) {
      await this.updateTargetEntityField(
        targetEntity,
        affected,
        newValue,
        affectedEntities,
      );
    }
  }

  /**
   * Loads entities by ID using the entity mapper.
   * @param entityids - List of entity entityiDs to load
   * @param entityType - The constructor/type of the entities
   */
  private async loadRelatedEntities(
    entityids: string[] | string,
    entityType: string,
  ): Promise<Entity[]> {
    const relatedEntities = Array.isArray(entityids) ? entityids : [entityids];

    const loadedEntities = await Promise.all(
      relatedEntities.map((id) => this.entityMapper.load(entityType, id)),
    );

    this.relatedEntities.push(...loadedEntities);

    return loadedEntities;
  }

  /**
   * Updates the target field in a dependent entity and tracks the change
   * for later confirmation and saving.
   * @param targetEntity - The entity to be updated
   * @param affected - Config defining which field to update
   * @param newValue - The new value to assign to the field
   * @param affectedEntities - Array to record changes
   */
  private async updateTargetEntityField(
    targetEntity: Entity,
    affected: any,
    newValue: any,
    affectedEntities: AffectedEntity[],
  ): Promise<void> {
    const targetFieldId = affected.targetFieldId;
    const fieldConfig = affected.targetEntityType.schema.get(targetFieldId);
    const newValues = this.entitySchemaService.valueToEntityFormat(
      newValue,
      fieldConfig,
    );

    if (targetEntity[targetFieldId] !== newValue) {
      targetEntity[targetFieldId] = newValue;
      affectedEntities.push({
        id: targetEntity.getId(),
        newStatus: newValues,
        targetFieldId,
        targetEntityType: affected.targetEntityType,
        selectedField: { ...fieldConfig, id: targetFieldId },
        affectedEntity: targetEntity,
        relatedReferenceField: this.relatedReferenceFieldConfig.label,
      });
    }
  }

  /**
   * Opens a dialog to confirm entity updates with the user.
   * Saves entities only if the user confirms the changes.
   */
  private async confirmAndSaveAffectedEntities(
    affectedEntities: AffectedEntity[],
  ): Promise<void> {
    const userConfirmed = await this.showConfirmationDialog(affectedEntities);
    if (!userConfirmed) return;

    // Todo: Currently if there are multiple rule set for same entity and field, we are showing in UI as multiple entries,
    // we need a proper UI to show the same entity and field with multiple values
    const updatesByEntityId = new Map<string, AffectedEntity[]>();
    userConfirmed.forEach((update) => {
      const existing = updatesByEntityId.get(update.id) || [];
      existing.push(update);
      updatesByEntityId.set(update.id, existing);
    });

    const savePromises: Promise<any>[] = [];
    updatesByEntityId.forEach((updates, entityId) => {
      const entity = this.relatedEntities.find((e) => e.getId() === entityId);
      if (entity) {
        updates.forEach((update) => {
          entity[update.targetFieldId] = update.newStatus;
        });
        savePromises.push(this.entityMapper.save(entity));
      }
    });

    this.unsavedChangesService.pending = false;
    await Promise.all(savePromises);
  }

  /**
   * Opens the confirmation dialog to let user to approve or update the changes.
   * @param entitiesToUpdate - List of entities with pending updates
   */
  private async showConfirmationDialog(
    entitiesToUpdate: AffectedEntity[],
  ): Promise<AffectedEntity[] | null> {
    const dialogRef = this.dialog.open(AutomatedStatusUpdateComponent, {
      maxHeight: "90vh",
      data: { entities: entitiesToUpdate },
    });
    return await lastValueFrom(dialogRef.afterClosed());
  }
}
