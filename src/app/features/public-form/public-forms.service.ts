import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity } from "app/core/entity/model/entity";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

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
   * - Filters configs to those with a linkedEntity ID.
   * - For each matching config, registers a "copy-form-<route>" action that:
   *   • Executes copying a prebuilt form URL based on the config.
   *   • Is only visible when matching configs exist for the given entity.
   */
  public async initCustomFormActions() {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter(
      (config) => this.getLinkedEntitiesFromConfig(config).length > 0,
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
   * - It checks all PublicFormConfig entries to find the one linked to the current entity type via `linkedEntity.id`.
   * - If a matching form is found, it generates the link including the entity ID as a query parameter and copies it.
   *
   * If no entity is provided, copies the public form link for the entity type (list-level) without any query parameter.
   */
  public async copyPublicFormLinkFromConfig(
    config: PublicFormConfig,
    entity?: Entity,
  ): Promise<boolean> {
    let url = `${window.location.origin}/public-form/form/${config.route}`;

    if (entity) {
      const queryParams = this.buildQueryParametersForEntity(config, entity);
      if (queryParams) {
        url += `?${queryParams}`;
      }
    }

    await navigator.clipboard.writeText(url);
    this.alertService.addInfo("Link copied: " + url);
    return true;
  }

  /**
   * Builds query parameters for a given entity based on the form's linked entities configuration.
   * Supports both single linkedEntity and multiple linkedEntities configurations.
   */
  private buildQueryParametersForEntity(
    config: PublicFormConfig,
    entity: Entity,
  ): string {
    const linkedEntities = this.getLinkedEntitiesFromConfig(config);
    const params: string[] = [];

    linkedEntities.forEach((linkedEntity) => {
      if (linkedEntity.id) {
        const paramKey = linkedEntity.id;
        const entityId = entity.getId();
        params.push(`${paramKey}=${encodeURIComponent(entityId)}`);
      }
    });

    return params.join("&");
  }

  /**
   * Gets all linked entities from config, supporting both legacy single linkedEntity
   * and new multiple linkedEntities configurations.
   */
  private getLinkedEntitiesFromConfig(
    config: PublicFormConfig,
  ): FormFieldConfig[] {
    // Priority: use linkedEntities if available, otherwise fall back to single linkedEntity
    if (config.linkedEntities?.length) {
      return config.linkedEntities.filter((entity) => entity?.id);
    }

    if (config.linkedEntity?.id) {
      return [config.linkedEntity];
    }

    return [];
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
    const linkedEntities = this.getLinkedEntitiesFromConfig(config);

    if (!linkedEntities.length) return false;

    // Check if any linked entity matches the provided entity type
    return linkedEntities.some((linkedEntity) => {
      if (linkedEntity.additional) {
        return linkedEntity.additional.toLowerCase() === entityType;
      }
      return false;
    });
  }
}
