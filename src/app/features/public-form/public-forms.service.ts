import { Logging } from "#src/app/core/logging/logging.service";
import { inject, Injectable } from "@angular/core";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import {
  PublicFormConfig,
  PublicFormEntityFormConfig,
} from "./public-form-config";
import { asArray } from "#src/app/utils/asArray";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityConfigService } from "app/core/entity/entity-config.service";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";

@Injectable({
  providedIn: "root",
})
export class PublicFormsService {
  private entityMapper = inject(EntityMapperService);
  private alertService = inject(AlertService);
  private entityActionsMenuService = inject(EntityActionsMenuService);
  private readonly adminEntityService = inject(AdminEntityService);
  private readonly entities = inject(EntityRegistry);
  private readonly entityConfigService = inject(EntityConfigService);
  private readonly unsavedChangesService = inject(UnsavedChangesService);

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
          execute: (entity) => {
            const singleEntity = Array.isArray(entity) ? entity[0] : entity;
            return this.copyPublicFormLinkFromConfig(config, singleEntity);
          },
          permission: "read",
          icon: "link",
          label: $localize`Copy Custom Form (${config.title})`,
          tooltip: $localize`Copy link to public form "${config.title}" that will connect submissions to this individual record.`,
          visible: (entity) =>
            this.isEntityTypeLinkedToConfig(config, asArray(entity)[0]),
          availableFor: "individual-only",
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
    const relevantForm = entity
      ? this.getRelevantFormForEntity(config, entity)
      : undefined;
    const formConfig = relevantForm ?? this.getFormConfigs(config)[0];

    return this.copyPublicFormLinkFromEntityFormConfig(
      config.route,
      formConfig,
      entity,
    );
  }

  private async copyPublicFormLinkFromEntityFormConfig(
    route: string,
    formConfig: PublicFormEntityFormConfig,
    entity?: Entity,
  ): Promise<boolean> {
    let url = `${window.location.origin}/public-form/form/${route}`;

    const matchingFieldIds = entity
      ? this.findMatchingLinkedFieldIds(formConfig, entity)
      : [];

    if (matchingFieldIds.length) {
      const params = new URLSearchParams();
      matchingFieldIds.forEach((fieldId) =>
        params.set(fieldId, entity.getId()),
      );
      url += `?${params.toString()}`;
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
    return matchingFieldIds.length > 0;
  }

  /**
   * Gets the relevant form configuration for a given entity from a PublicFormConfig.
   * Handles both OLD format (entity/linkedEntities at top level) and NEW format (forms array).
   */
  private getRelevantFormForEntity(
    config: PublicFormConfig,
    entity: Entity,
  ): PublicFormEntityFormConfig | undefined {
    return this.getFormConfigs(config).find(
      (form) => this.findMatchingLinkedFieldIds(form, entity).length > 0,
    );
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
    return this.getRelevantFormForEntity(config, entity) !== undefined;
  }

  /**
   * Checks if a PublicFormConfig has any linked entities configured.
   */
  public hasLinkedEntities(config: PublicFormConfig): boolean {
    if (config.linkedEntities?.length) {
      return true;
    }

    if (!config.forms?.length) {
      return false;
    }

    return config.forms.some((form) => form.linkedEntities?.length);
  }

  /**
   * Returns the normalized list of form configs, supporting both
   * the new `forms` array and legacy top-level config.
   */
  private getFormConfigs(
    config: PublicFormConfig,
  ): PublicFormEntityFormConfig[] {
    if (config.forms?.length) {
      return config.forms;
    }
    return [
      {
        entity: config.entity,
        columns: config.columns ?? [],
        prefilled: config.prefilled,
        linkedEntities: config.linkedEntities,
      },
    ];
  }

  /**
   * Finds linked field IDs in a form config whose schema references the given entity's type.
   */
  private findMatchingLinkedFieldIds(
    formConfig: PublicFormEntityFormConfig,
    entity: Entity,
  ): string[] {
    const entityType = entity.getConstructor?.()?.ENTITY_TYPE?.toLowerCase();
    if (
      !entityType ||
      !formConfig.entity ||
      !formConfig.linkedEntities?.length
    ) {
      return [];
    }

    const entityConstructor = this.entities.get(formConfig.entity);
    if (!entityConstructor) return [];

    return formConfig.linkedEntities.filter((fieldId) => {
      const fieldSchema = entityConstructor.schema.get(fieldId);
      return fieldSchema?.additional?.toLowerCase() === entityType;
    });
  }

  /**
   * Save new custom fields to entity config for a PublicFormConfig.
   * When fields are created in the public form columns editor, they're added to the in-memory schema
   * but not persisted to the config. This method persists them.
   *
   * @param publicFormConfig The PublicFormConfig entity being saved
   */
  async saveCustomFieldsToEntityConfig(
    publicFormConfig: PublicFormConfig,
  ): Promise<void> {
    if (!publicFormConfig.entity) {
      return;
    }

    const entityConstructor = this.entities.get(publicFormConfig.entity);
    const entityConfig =
      this.entityConfigService.getEntityConfig(entityConstructor) || {};
    const existingAttributes = entityConfig.attributes || {};

    // Check if there are any fields in schema that aren't in global config yet
    let hasNewFields = false;
    for (const [fieldId] of entityConstructor.schema.entries()) {
      if (!Object.hasOwn(existingAttributes, fieldId)) {
        hasNewFields = true;
        break;
      }
    }

    if (hasNewFields) {
      this.unsavedChangesService.pending = false;
      await this.adminEntityService.setAndSaveEntityConfig(entityConstructor);
    }
  }
}
