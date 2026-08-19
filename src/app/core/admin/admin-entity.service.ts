import { EventEmitter, inject, Injectable, LOCALE_ID } from "@angular/core";
import { EntityConstructor } from "../entity/model/entity";
import { Config } from "../config/config";
import { EntityConfig } from "../entity/entity-config";
import { EntityConfigService } from "../entity/entity-config.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { EntityListConfig } from "../entity-list/EntityListConfig";
import { EntityDetailsConfig } from "../entity-details/EntityDetailsConfig";
import { DynamicComponentConfig } from "../config/dynamic-components/dynamic-component-config.interface";
import { NoteDetailsConfig } from "#src/app/child-dev-project/notes/note-details/note-details-config.interface";
import { mergeTranslatableValues } from "../config/multi-lingual-config";
import { DEFAULT_LANGUAGE } from "../language/language-statics";
import { availableLocales } from "../language/languages";

/**
 * Simply service to centralize updates between various admin components in the form builder.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntityService {
  public entitySchemaUpdated = new EventEmitter<void>();
  private entityMapper = inject(EntityMapperService);

  private readonly locale = inject(LOCALE_ID);
  private readonly validLocaleIds = availableLocales.values.map((v) => v.id);

  /**
   * Set a new schema field to the given entity and trigger update event for related admin components.
   * @param entityType
   * @param fieldId
   * @param updatedEntitySchema
   */
  updateSchemaField(
    entityType: EntityConstructor,
    fieldId: any,
    updatedEntitySchema: any,
  ) {
    entityType.schema.set(fieldId, updatedEntitySchema);
    this.entitySchemaUpdated.next();
  }

  /**
   * Updates the EntityConfig in the database to take any in-memory changes
   * of the EntityConstructor and persist them to the config doc.
   *
   * @param entityConstructor The entity type to be updated in the Config DB
   * @param configEntitySettings (optional) general entity settings to also be applied
   * @param configListView (optional) list view settings also to be applied
   * @param configDetailsView (optional) details view settings also to be applied
   * @param additionalEntityConstructors (optional) additional entity types to save in the same transaction
   */
  public async setAndSaveEntityConfig(
    entityConstructor: EntityConstructor,
    configEntitySettings?: EntityConfig,
    configListView?: DynamicComponentConfig<EntityListConfig>,
    configDetailsView?: DynamicComponentConfig<
      EntityDetailsConfig | NoteDetailsConfig
    >,
    additionalEntityConstructors?: EntityConstructor[],
  ): Promise<{ previous: Config; current: Config }> {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newConfig = originalConfig.copy();

    // Update the main entity schema
    this.updateConfigWithEntitySchema(
      newConfig,
      entityConstructor,
      configEntitySettings,
    );

    // Add additional view config if available
    if (configListView) {
      newConfig.data[EntityConfigService.getListViewId(entityConstructor)] =
        configListView;
    }
    if (configDetailsView) {
      newConfig.data[EntityConfigService.getDetailsViewId(entityConstructor)] =
        configDetailsView;
    }

    // Update additional entity schemas (e.g., related entities modified through panels)
    for (const additionalEntity of additionalEntityConstructors ?? []) {
      this.updateConfigWithEntitySchema(newConfig, additionalEntity);
    }

    const updatedConfig: Config = await this.entityMapper.save(newConfig);
    return { previous: originalConfig, current: updatedConfig };
  }

  private updateConfigWithEntitySchema(
    newConfig: Config,
    entityConstructor: EntityConstructor,
    configEntitySettings?: EntityConfig,
  ) {
    let entitySchemaConfig: EntityConfig =
      this.getEntitySchemaFromConfig(newConfig, entityConstructor) ?? {};
    // Initialize config if not present
    entitySchemaConfig.attributes = entitySchemaConfig.attributes ?? {};

    for (const [fieldId, field] of entityConstructor.schema.entries()) {
      // Skip internal fields that are defined in the base Entity class
      if (field.isInternalField) {
        continue;
      }
      // the runtime schema holds values resolved to the active language, so merge
      // onto the raw config to keep translations of other languages (#3862)
      entitySchemaConfig.attributes[fieldId] = this.mergeTranslations(
        entitySchemaConfig.attributes[fieldId],
        field,
      );
    }

    // Add additional general settings if available
    if (configEntitySettings) {
      Object.assign(
        entitySchemaConfig,
        this.mergeTranslations(entitySchemaConfig, configEntitySettings),
      );
    }
  }

  /**
   * Merge an edited (language-resolved) config part onto its raw counterpart from
   * the config document, so that translations for other languages are preserved.
   */
  private mergeTranslations<T extends Record<string, any>>(
    raw: Record<string, any> | undefined,
    edited: T,
  ): T {
    return mergeTranslatableValues(
      raw,
      edited,
      this.locale,
      DEFAULT_LANGUAGE,
      this.validLocaleIds,
    );
  }

  private getEntitySchemaFromConfig(
    config: Config<unknown>,
    entityConstructor: EntityConstructor,
  ): EntityConfig {
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityConstructor.ENTITY_TYPE;

    if (!config.data[entityConfigKey]) {
      config.data[entityConfigKey] = {};
    }

    return config.data[entityConfigKey];
  }
}
