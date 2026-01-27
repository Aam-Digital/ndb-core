import { Logging } from "#src/app/core/logging/logging.service";
import { inject, Injectable } from "@angular/core";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { PublicFormConfig } from "./public-form-config";
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
    let url = `${window.location.origin}/public-form/form/${config.route}`;
    let hasMatchingParameters = false;

    const linkedFieldIds =
      config.forms?.flatMap((form) => form.linkedEntities || []) ||
      config.linkedEntities ||
      [];

    if (entity && linkedFieldIds.length) {
      const params = new URLSearchParams();
      const entityType = entity.getConstructor?.()?.ENTITY_TYPE?.toLowerCase();

      // For each form in the config, check if any linked fields match the entity type
      const forms = config.forms || [
        {
          entity: config.entity,
          linkedEntities: config.linkedEntities,
        },
      ];

      for (const form of forms) {
        if (!form.entity || !form.linkedEntities) continue;

        const entityConstructor = this.entities.get(form.entity);
        if (!entityConstructor) continue;

        (form.linkedEntities || []).forEach((fieldId) => {
          const fieldSchema = entityConstructor.schema.get(fieldId);
          if (fieldSchema?.additional?.toLowerCase() === entityType) {
            params.set(fieldId, entity.getId());
            hasMatchingParameters = true;
          }
        });
      }

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

    const forms = config.forms || [
      {
        entity: config.entity,
        linkedEntities: config.linkedEntities,
      },
    ];

    // Check each form's linked fields
    for (const form of forms) {
      if (!form.entity || !form.linkedEntities) continue;

      const entityConstructor = this.entities.get(form.entity);
      if (!entityConstructor) continue;

      // Check if any linked field has matching entity type in its schema
      const hasMatch = form.linkedEntities.some((fieldId) => {
        const fieldSchema = entityConstructor.schema.get(fieldId);
        return fieldSchema?.additional?.toLowerCase() === entityType;
      });

      if (hasMatch) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a PublicFormConfig has any linked entities configured.
   */
  private hasLinkedEntities(config: PublicFormConfig): boolean {
    return !!config.linkedEntities?.length;
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
