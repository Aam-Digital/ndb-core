import { Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity } from "app/core/entity/model/entity";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { AdminEntityService } from "app/core/admin/admin-entity.service";

@Injectable({
  providedIn: "root",
})
export class PublicFormsService {
  constructor(
    private entityMapper: EntityMapperService,
    private alertService: AlertService,
    private entityActionsMenuService: EntityActionsMenuService,
    private adminEntityService: AdminEntityService,
  ) {}

  /**
   * Initializes and registers custom form actions for entities.
   * - Loads all PublicFormConfig entries from the EntityMapper.
   * - Filters configs to those with a linkedEntity ID.
   * - For each matching config, registers a "copy-form-<route>" action that:
   *   • Executes copying a prebuilt form URL based on the config.
   *   • Is only visible when matching configs exist for the given entity.
   */
  public async initCustomFormActions() {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) => config.linkedEntity?.id);
    // Unregister any previously registered actions for these form configs
    const actionKeys = matchingForms.map(
      (config) => `copy-form-${config.getId()}`,
    );
    this.entityActionsMenuService.unregisterActions(actionKeys);
    for (const config of matchingForms) {
      this.entityActionsMenuService.registerActions([
        {
          action: `copy-form-${config.getId()}`,
          execute: (entity) =>
            this.copyPublicFormLinkFromConfig(entity, config),
          permission: "read",
          icon: "link",
          label: `Copy Custom Form (${config.title})`,
          tooltip: `Copy link to public form "${config.title}" that will connect submissions to this individual record.`,
          visible: (entity) =>
            this.getMatchingPublicFormConfigs(config, entity),
        },
      ]);
    }
  }

  /**
   * Copies the public form link to clipboard if a matching form exists for the given entity.
   * It checks all PublicFormConfig entries to find the one linked to the current entity type via `linkedEntity.id`.
   * If a matching form is found, it generates the link including the entity ID as a query parameter and copies it.
   */
  public async copyPublicFormLinkFromConfig(
    entity: Entity,
    config: PublicFormConfig,
  ): Promise<boolean> {
    const paramKey = config.linkedEntity.id;
    const entityId = entity.getId();
    const fullUrl = `${window.location.origin}/public-form/form/${config.route}?${paramKey}=${encodeURIComponent(entityId)}`;

    await navigator.clipboard.writeText(fullUrl);
    this.alertService.addInfo("Link copied: " + fullUrl);
    return true;
  }

  public async getMatchingPublicFormConfigs(
    config: PublicFormConfig,
    entity: Entity,
  ): Promise<boolean> {
    if (!entity.getConstructor) {
      return false;
    }

    const entityType = entity.getConstructor().ENTITY_TYPE.toLowerCase();
    const linkedEntity = config.linkedEntity;

    if (!linkedEntity) return false;

    if (linkedEntity.additional) {
      return linkedEntity.additional.toLowerCase() === entityType;
    }

    return false;
  }

  public async updateFieldInPublicFormConfig(
    publicFormConfig: PublicFormConfig,
    fieldId: string,
    entitySchemaField: any,
    entityType: any,
  ): Promise<void> {
    let found = false;
    const columns = publicFormConfig.columns;

    if (Array.isArray(columns)) {
      for (const column of columns) {
        if (Array.isArray(column.fields)) {
          for (let i = 0; i < column.fields.length; i++) {
            const f = column.fields[i];
            if (typeof f === "string" && f === fieldId) {
              column.fields[i] = { id: fieldId, ...entitySchemaField };
              found = true;
            } else if (typeof f === "object" && f?.id === fieldId) {
              column.fields[i] = { ...f, ...entitySchemaField, id: fieldId };
              found = true;
            }
          }
        }
      }
    }

    if (!found) {
      // Update base schema also if the field was not found in the publicform
      this.adminEntityService.updateSchemaField(
        entityType,
        fieldId,
        entitySchemaField,
      );
    }

    await this.entityMapper.save(publicFormConfig, false);
  }
}
