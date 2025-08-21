import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity } from "app/core/entity/model/entity";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";

@Injectable({
  providedIn: "root",
})
export class PublicFormsService {
  private entityMapper = inject(EntityMapperService);
  private alertService = inject(AlertService);
  private entityActionsMenuService = inject(EntityActionsMenuService);

  /**
   * Initializes and registers custom form actions for entities.
   */
  public async initCustomFormActions() {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) => config.linkedEntity?.id);
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
          label: $localize`Copy Custom Form (${config.title})`,
          tooltip: $localize`Copy link to public form "${config.title}" that will connect submissions to this individual record.`,
          visible: (entity) =>
            this.getMatchingPublicFormConfigs(config, entity),
        },
      ]);
    }
  }

  /**
   * Copies the public form link to clipboard for an individual entity.
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

  /**
   * Copies the public form link for an entity type (list-level).
   */
  public async copyPublicFormLinkForEntityType(
    config: PublicFormConfig,
  ): Promise<boolean> {
    const url = `${window.location.origin}/public-form/form/${config.route}`;
    await navigator.clipboard.writeText(url);
    this.alertService.addInfo("Link copied: " + url);
    return true;
  }

  /**
   * Returns all public form configs.
   */
  public async getAllPublicFormConfigs(): Promise<PublicFormConfig[]> {
    return this.entityMapper.loadType(PublicFormConfig);
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
}
