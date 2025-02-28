import { inject, Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import {
  AdditionalImportAction,
  AdditionalIndirectLinkAction,
  AdditonalDirectLinkAction,
} from "./additional-import-action";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { ConfigService } from "../../config/config.service";

/**
 * Service to handle additional import actions
 * like creating secondary relationship entities.
 */
@Injectable({
  providedIn: "root",
})
export class ImportAdditionalService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);

  private linkableEntities = new Map<string, AdditionalImportAction[]>();

  constructor(private configService: ConfigService) {
    this.updateLinkableEntities();
    this.configService.configUpdates.subscribe(() =>
      // need to wait until EntityConfigService has updated the entityRegistry after the configUpdate
      // TODO: better way to wait for EntityConfig updates?
      setTimeout(() => this.updateLinkableEntities()),
    );
  }

  private updateLinkableEntities() {
    this.linkableEntities.clear();
    for (const [entityTypeId, entityType] of this.entityRegistry.entries()) {
      const actions = this.generateLinkActionsFor(entityTypeId);
      if (actions.length > 0) {
        this.linkableEntities.set(entityTypeId, actions);
      } else {
        this.linkableEntities.delete(entityTypeId);
      }
    }
    console.log("Import Actions", this.linkableEntities);
  }

  private generateLinkActionsFor(sourceType: string): AdditionalImportAction[] {
    const refs: { [entityType: string]: FormFieldConfig[] } =
      EntityDatatype.findFieldsReferencingEntityType(
        sourceType,
        this.entityRegistry,
      );

    const directActions: AdditonalDirectLinkAction[] = [];
    const indirectActions: AdditionalIndirectLinkAction[] = [];

    for (const [targetType, fields] of Object.entries(refs)) {
      const targetTypeCtr = this.entityRegistry.get(targetType);

      for (const field of fields) {
        // direct linking to the target entity
        if (field.isArray) {
          directActions.push({
            sourceType,
            mode: "direct",
            targetType,
            targetProperty: field.id,
          });
        }

        // other types these referencing types are also linking to (so they can serve as a connection relationship entity)
        for (const [fieldId2, field2] of targetTypeCtr.schema.entries()) {
          if (fieldId2 === field.id) continue; // skip the same field
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
            relationshipProperty: field.id,
            relationshipTargetProperty: fieldId2,
            targetType: field2.additional,
          });
        }
      }
    }

    // TODO: hide those used as indirect from direct actions

    return [...directActions, ...indirectActions];

    // old code: to be removed
    /*
    if (sourceType === "Child") {
      return [
        {
          sourceType: "Child",
          mode: "direct",
          targetType: RecurringActivity.ENTITY_TYPE,
          targetProperty: "participants",
        },
        {
          sourceType: "Child",
          mode: "indirect",
          relationshipEntityType: "ChildSchoolRelation",
          relationshipProperty: "childId",
          relationshipTargetProperty: "schoolId",
          targetType: "School",
        },
      ];
    }

    if (sourceType === "Individual") {
      return [
        {
          sourceType: "Individual",
          mode: "indirect",
          relationshipEntityType: "Participant2Event",
          relationshipProperty: "participant",
          relationshipTargetProperty: "event",
          targetType: "Event",
        },
        {
          sourceType: "Individual",
          mode: "indirect",
          relationshipEntityType: "Individual2Organisation",
          relationshipProperty: "individual",
          relationshipTargetProperty: "organisation",
          targetType: "organisation",
        },
      ];
    }

    return [];
     */
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
      ).filter((a) => a.targetType === targetEntityType);
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
      }

      if (action) actionFuncs.push(action);
    }

    return Promise.all(actionFuncs);
  }

  public async undoImport(importMeta: ImportMetadata): Promise<void> {
    const undoActions = [];

    for (const additionalImport of importMeta.config.additionalActions ?? []) {
      let action;

      switch (additionalImport.mode) {
        case "direct":
          action = this.undoLinkDirectly(importMeta.ids, additionalImport);
          break;
        case "indirect":
          action = this.undoLinkIndirectly(importMeta.ids, additionalImport);
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
      action.targetType,
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
      action.targetType,
      action.targetId,
    );
    targetEntity[action.targetProperty] = targetEntity[
      action.targetProperty
    ]?.filter((e) => !entitiesToBeUnlinked.includes(e));
    return this.entityMapper.save(targetEntity);
  }
}
