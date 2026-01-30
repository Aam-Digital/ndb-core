import { inject, Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import {
  AdditionalImportAction,
  AdditionalIndirectLinkAction,
  AdditonalDirectLinkAction,
  AdditionalPrefilledFieldAction,
} from "./additional-import-action";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { ConfigService } from "../../config/config.service";
import { Note } from "../../../child-dev-project/notes/model/note";
import { EventNote } from "../../../child-dev-project/attendance/model/event-note";
import { Todo } from "../../../features/todos/model/todo";
import { EntityRelationsService } from "../../entity/entity-mapper/entity-relations.service";
import { asArray } from "../../../utils/asArray";

/**
 * Service to handle additional import actions
 * like creating secondary relationship entities.
 */
@Injectable({
  providedIn: "root",
})
export class ImportAdditionalService {
  private configService = inject(ConfigService);

  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entityRelationsService = inject(EntityRelationsService);

  private linkableEntities = new Map<string, AdditionalImportAction[]>();

  constructor() {
    this.updateLinkableEntities();
    this.configService.configUpdates.subscribe(() =>
      // need to wait until EntityConfigService has updated the entityRegistry after the configUpdate
      // TODO: better way to wait for EntityConfig updates?
      setTimeout(() => this.updateLinkableEntities()),
    );
  }

  private updateLinkableEntities() {
    this.linkableEntities.clear();
    for (const [entityTypeId] of this.entityRegistry.entries()) {
      const actions = this.generateLinkActionsFor(entityTypeId);
      if (actions.length > 0) {
        this.linkableEntities.set(entityTypeId, actions);
      } else {
        this.linkableEntities.delete(entityTypeId);
      }
    }
  }

  private generateLinkActionsFor(sourceType: string): AdditionalImportAction[] {
    const refs =
      this.entityRelationsService.getEntityTypesReferencingType(sourceType);

    const directActions: AdditonalDirectLinkAction[] = [];
    const indirectActions: AdditionalIndirectLinkAction[] = [];

    for (const ref of refs) {
      for (const field of ref.referencingProperties) {
        if (field.entityReferenceRole === "composite") {
          // for "relationship" types that only serve as connections, do not add a "direct" link import but an "indirect" one
          indirectActions.push(
            ...this.findIndirectLinkActionsForField(
              ref.entityType.ENTITY_TYPE,
              field,
              sourceType,
            ),
          );
        } else {
          // direct linking to the target entity
          if (field.isArray) {
            directActions.push({
              sourceType,
              mode: "direct",
              targetEntityType: ref.entityType.ENTITY_TYPE,
              targetProperty: field.id,
            });
          }
        }
      }
    }

    return [...directActions, ...indirectActions];
  }

  private findIndirectLinkActionsForField(
    targetType: string,
    targetField: FormFieldConfig,
    sourceType: string,
  ) {
    const indirectActions: AdditionalIndirectLinkAction[] = [];
    const targetTypeCtr = this.entityRegistry.get(targetType);

    // other types these referencing types are also linking to (so they can serve as a connection relationship entity)
    for (const [fieldId2, field2] of targetTypeCtr.schema.entries()) {
      if (targetField.entityReferenceRole !== "composite") continue; // only use explicit relationship fields for indirect actions
      if (fieldId2 === targetField.id) continue; // skip the same field
      if (field2.dataType !== EntityDatatype.dataType) continue; // skip non-entity fields
      if (
        !field2.additional ||
        (Array.isArray(field2.additional) && field2.additional.length === 0)
      )
        continue; // skip if no reference type is enabled

      indirectActions.push({
        sourceType,
        mode: "indirect",
        relationshipEntityType: targetType,
        relationshipProperty: targetField.id,
        relationshipTargetProperty: fieldId2,
        targetType: field2.additional,
        expertOnly:
          targetType === sourceType ||
          [Note.ENTITY_TYPE, EventNote.ENTITY_TYPE, Todo.ENTITY_TYPE].includes(
            targetType,
          ),
      });
    }

    return indirectActions;
  }

  /**
   * Get the entity actions that data of the given entity type can be linked to during its import.
   * (e.g. for "Child" entityType, the result could be [{ targetType: "School" ...}], indicating that during import of children, they can be linked to a school)
   * @param entityType
   */
  getActionsLinkingFor(entityType: string): AdditionalImportAction[] {
    return this.linkableEntities.get(entityType) ?? [];
  }

  /**
   * Get the entity types that during their import can be linked to the given target entity type.
   * (e.g. for "School" targetEntityType, the result could be [{ sourceType: "Child" ... }], indicating that during import of children, they can be linked to a school)
   * @param targetEntityType
   */
  getActionsLinkingTo(targetEntityType: string): AdditionalImportAction[] {
    const linkingTypes: AdditionalImportAction[] = [];

    for (const entityType of this.linkableEntities.keys()) {
      const matchingActions = (
        this.linkableEntities.get(entityType) ?? []
      ).filter((a) => {
        // Different action types use different property names for target entity type
        switch (a.mode) {
          case "direct":
            return a.targetEntityType === targetEntityType;
          case "indirect":
          case "prefill":
            return a.targetType === targetEntityType;
          default:
            return false;
        }
      });
      linkingTypes.push(...matchingActions);
    }

    return linkingTypes;
  }

  /**
   * Execute additional import actions for the given entities,
   * linking entities.
   * @param entities
   * @param settings
   */
  public executeImport(entities: Entity[], settings: ImportSettings) {
    const actionFuncs = [];

    for (const additionalImport of settings.additionalActions ?? []) {
      let action;

      switch (additionalImport.mode) {
        case "direct":
          action = this.linkDirectly(entities, additionalImport);
          break;
        case "indirect":
          action = this.linkIndirectly(entities, additionalImport);
          break;
        case "prefill":
          action = this.prefillField(entities, additionalImport);
          break;
      }

      if (action) actionFuncs.push(action);
    }

    return Promise.all(actionFuncs);
  }

  /**
   * Prefill a field on each imported entity with a fixed value.
   * @param entities Imported entities
   * @param action Prefill action details
   */
  private prefillField(
    entities: Entity[],
    action: AdditionalPrefilledFieldAction,
  ) {
    for (const entity of entities) {
      entity[action.fieldId] = action.targetId;
    }
    // No async operation needed, but return a resolved promise for consistency
    return Promise.resolve();
  }

  public async undoImport(importMeta: ImportMetadata): Promise<void> {
    const undoActions = [];

    for (const additionalImport of importMeta.config.additionalActions ?? []) {
      let action;

      switch (additionalImport.mode) {
        case "direct":
          action = this.undoLinkDirectly(
            importMeta.createdEntities,
            additionalImport,
          );
          break;
        case "indirect":
          action = this.undoLinkIndirectly(
            importMeta.createdEntities,
            additionalImport,
          );
          break;
      }

      if (action) undoActions.push(action);
    }

    await Promise.all(undoActions);
  }

  /**
   * Link the imported entities "indirectly"
   * by creating "relationship entities" between the imported entities and a given target entity.
   * @param entitiesToBeLinked An array of imported entities for which the additional linking should be done
   * @param action Details of the specific action to be performed
   * @private
   */
  private linkIndirectly(
    entitiesToBeLinked: Entity[],
    action: AdditionalIndirectLinkAction,
  ) {
    const relationCtr = this.entityRegistry.get(action.relationshipEntityType);

    const relations = entitiesToBeLinked.map((entity) => {
      const relation = new relationCtr();
      relation[action.relationshipProperty] = entity.getId();
      relation[action.relationshipTargetProperty] = action.targetId;
      return relation;
    });
    return this.entityMapper.saveAll(relations);
  }

  /**
   * Undo the `linkIndirectly` action and delete relationship entities linking imported entities to other entity.
   * @param entitiesToBeUnlinked An array of imported entities for which the additional linking was done
   * @param action Details of the specific action to be performed
   * @private
   */
  private async undoLinkIndirectly(
    entitiesToBeUnlinked: string[],
    action: AdditionalIndirectLinkAction,
  ) {
    const relations = await this.entityMapper.loadType(
      action.relationshipEntityType,
    );
    const imported = relations.filter((rel) =>
      entitiesToBeUnlinked.includes(rel[action.relationshipProperty]),
    );
    await Promise.all(imported.map((rel) => this.entityMapper.remove(rel)));
  }

  /**
   * Link the imported entities "directly"
   * by updating and entity-reference field in a given other entity.
   * @param entitiesToBeLinked An array of imported entities for which the additional linking should be done
   * @param action Details of the specific action to be performed
   * @private
   */
  private async linkDirectly(
    entitiesToBeLinked: Entity[],
    action: AdditonalDirectLinkAction,
  ) {
    const targetEntity = await this.entityMapper.load(
      action.targetEntityType,
      action.targetId,
    );
    const ids = entitiesToBeLinked.map((e) => e.getId());

    if (!targetEntity[action.targetProperty]) {
      targetEntity[action.targetProperty] = [];
    }
    targetEntity[action.targetProperty].push(...ids);
    return this.entityMapper.save(targetEntity);
  }

  /**
   * Undo the `linkDirectly` action and remove references to the imported entities from the target entity.
   * @param entitiesToBeUnlinked An array of imported entities for which the additional linking was done
   * @param action Details of the specific action to be performed
   * @private
   */
  private async undoLinkDirectly(
    entitiesToBeUnlinked: string[],
    action: AdditonalDirectLinkAction,
  ) {
    const targetEntity = await this.entityMapper.load(
      action.targetEntityType,
      action.targetId,
    );
    targetEntity[action.targetProperty] = targetEntity[
      action.targetProperty
    ]?.filter((e) => !entitiesToBeUnlinked.includes(e));
    return this.entityMapper.save(targetEntity);
  }

  /**
   * Create a human-readable label for the given import action.
   * @param importAction
   * @param forTargetType (Optional) If true, phrased for the context menu of the target type to import the source type and link back
   */
  createActionLabel(
    importAction: AdditionalImportAction,
    forTargetType: boolean = false,
  ): string {
    // Handle prefill mode separately
    if (importAction.mode === "prefill") {
      const prefillAction = importAction;
      const sourceType = this.entityRegistry.get(prefillAction.sourceType);
      const targetType = this.entityRegistry.get(prefillAction.targetType);
      const fieldLabel =
        sourceType.schema.get(prefillAction.fieldId)?.label ||
        prefillAction.fieldId;
      return $localize`Pre-fill "${fieldLabel}" (${targetType.toString()})`;
    }

    const sourceType = this.entityRegistry.get(importAction.sourceType);
    const targetTypes = importAction["targetType"]
      ? asArray(importAction["targetType"]).map((type) =>
          this.entityRegistry.get(type),
        )
      : [];
    const relationshipType = importAction["relationshipEntityType"]
      ? this.entityRegistry.get(importAction["relationshipEntityType"])
      : null;

    // normally just one type; join with " / " if several
    const targetTypeLabel = targetTypes.map((t) => t.toString()).join(" / ");

    let label: string;
    if (!forTargetType) {
      label = $localize`Link imported ${sourceType.toString(true)} to a ${targetTypeLabel}`;
    } else {
      label = $localize`Import related ${sourceType.toString(true)} for this ${targetTypeLabel}`;
    }

    label += this.getAdditionalContextDetailsForActionLabel(
      importAction,
      targetTypes,
      relationshipType,
    );

    return label;
  }

  private getAdditionalContextDetailsForActionLabel(
    importAction: AdditonalDirectLinkAction | AdditionalIndirectLinkAction,
    targetTypes: EntityConstructor[],
    relationshipType: EntityConstructor,
  ): string {
    let labelExtension = "";

    if (
      (importAction as AdditonalDirectLinkAction).targetProperty &&
      targetTypes?.length
    ) {
      const targetProps = targetTypes
        .map(
          (t) =>
            t.schema.get(
              (importAction as AdditonalDirectLinkAction).targetProperty,
            )?.label,
        )
        .filter(Boolean) as string[];
      if (targetProps?.length) {
        labelExtension = ` (as ${targetProps.join(", ")})`;
      }
    } else if (
      (importAction as AdditionalIndirectLinkAction).relationshipEntityType &&
      relationshipType?.label
    ) {
      labelExtension = ` (through ${relationshipType?.toString(true)})`;
    }

    return labelExtension;
  }
}
