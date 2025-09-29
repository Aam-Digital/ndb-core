import { Logging } from "#src/app/core/logging/logging.service";
import { Injectable, inject } from "@angular/core";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { PublicFormConfig } from "./public-form-config";

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
          visible: (entity) => this.isEntityTypeLinkedToConfig(config, entity),
        },
      ]);
    }
  }

  /**
   * Copies a public form link to the clipboard for a given config and (optionally) an entity.
   * - If an entity is provided and its type matches any linkedEntities in the config,
   *   generates a URL with the entity ID as a query parameter (e.g. ?children=Child:123).
   * - If no entity is provided, or if the entity type does not match any linkedEntities,
   *   generates the base public form URL (list-level) without any query parameters.
   */
  public async copyPublicFormLinkFromConfig(
    config: PublicFormConfig,
    entity?: Entity,
  ): Promise<boolean> {
    let url = `${window.location.origin}/public-form/form/${config.route}`;
    let hasMatchingParameters = false;

    if (entity && config.linkedEntities?.length) {
      const params = new URLSearchParams();

      config.linkedEntities.forEach((entityConfig) => {
        if (
          entityConfig.id &&
          entityConfig.additional?.toLowerCase() ===
            entity.getConstructor?.()?.ENTITY_TYPE?.toLowerCase()
        ) {
          params.set(entityConfig.id, entity.getId());
          hasMatchingParameters = true;
        }
      });

      if (hasMatchingParameters) {
        url += `?${params.toString()}`;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access might fail in tests or unsupported browsers
      Logging.warn(
        "PublicFormsService.copyPublicFormLinkFromConfig write to clipboard failed.",
      );
    }
    this.alertService.addInfo("Link copied: " + url);
    return hasMatchingParameters;
  }

  /**
   * Returns all public form configs.
   */
  public async getAllPublicFormConfigs(): Promise<PublicFormConfig[]> {
    return this.entityMapper.loadType(PublicFormConfig);
  }

  public async isEntityTypeLinkedToConfig(
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
