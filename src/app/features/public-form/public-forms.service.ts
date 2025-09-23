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
   * - Loads all PublicFormConfig entries from the EntityMapper.
   * - Filters configs to those with linkedEntities configured.
   * - For each matching config, registers a "copy-form-<route>" action that:
   *   • Executes copying a prebuilt form URL based on the config.
   *   • Is only visible when matching configs exist for the given entity.
   */
  public async initCustomFormActions() {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) =>
      this.hasLinkedEntities(config),
    );
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
            this.copyPublicFormLinkFromConfig(config, entity),
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
   * Copies the public form link to clipboard if a matching form exists for the given entity.
   * - It checks PublicFormConfig entries to find those linked to the current entity type via linkedEntities.
   * - If matching forms are found, it generates the link including the entity ID as query parameters and copies it.
   *
   * If no entity is provided, copies the public form link for the entity type (list-level) without any query parameter.
   */
  public async copyPublicFormLinkFromConfig(
    config: PublicFormConfig,
    entity?: Entity,
  ): Promise<boolean> {
    let url = `${window.location.origin}/public-form/form/${config.route}`;
    if (entity && config.linkedEntities?.length) {
      const params = new URLSearchParams();
      config.linkedEntities.forEach((entityConfig) => {
        if (entityConfig.id) {
          params.set(entityConfig.id, entity.getId());
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
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
    const linkedEntities = config.linkedEntities || [];

    return linkedEntities.some(
      (entityConfig) => entityConfig.additional?.toLowerCase() === entityType,
    );
  }

  /**
   * Checks if a PublicFormConfig has any linked entities configured.
   */
  private hasLinkedEntities(config: PublicFormConfig): boolean {
    return !!config.linkedEntities?.length;
  }
}
