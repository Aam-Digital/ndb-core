import { inject, Injectable } from "@angular/core";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import {
  EntityRelationResolverService,
  LoadedEntitiesCache,
} from "#src/app/core/entity/entity-relation-resolver/entity-relation-resolver.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { Logging } from "#src/app/core/logging/logging.service";
import { TemplateExport } from "../template-export.entity";
import {
  getRelatedRecordsLevels,
  canBeUsedInPlaceholder,
  getRelatedRecordsPlaceholder,
  RELATED_RECORDS_PROPERTY,
  TemplateExportRelatedRecords,
} from "./template-export-related-records";

/**
 * The data to add to one exported record: its related records
 * by the record type and field of their {@link TemplateExportRelatedRecords} config,
 * under {@link RELATED_RECORDS_PROPERTY} so that they never hide a field of the record.
 */
export type RelatedRecordsData = {
  [RELATED_RECORDS_PROPERTY]?: Record<
    string,
    Record<string, Record<string, unknown>[]>
  >;
};

/**
 * A record in the nested data of an exported record:
 * the exported record itself, or a related record (at any level) below it.
 */
interface NestedRecord {
  id: string;
  /**
   * The record's data in the result, into which its related records are written
   * (for an exported record, it starts out with none; for a related record, as its resolved copy).
   */
  data: RelatedRecordsData;
  /** the record of which this one is a related record */
  relatedTo?: NestedRecord;
}

/**
 * Load the records linking *to* an exported record (e.g. the sub-tasks of a task),
 * as configured for a template in {@link TemplateExport.relatedRecords},
 * so that they can be used in placeholders of the template file.
 *
 * (Records that the exported record itself links to are resolved by the
 * {@link EntityRelationResolverService} without any configuration.)
 */
@Injectable({
  providedIn: "root",
})
export class TemplateExportRelatedRecordsService {
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly relationResolver = inject(EntityRelationResolverService);
  private readonly entityRegistry = inject(EntityRegistry);

  /** configs already reported as invalid, to report each only once per session */
  private readonly reportedConfigs = new Set<string>();

  /**
   * Load the related records configured for the template, for each of the given records.
   *
   * Related records are plain copies with their own entity-reference fields resolved
   * one level deep (like the exported record itself), excluding archived records
   * and sorted by their display text.
   *
   * @param template The template, with the configs of the related records to load
   * @param records The exported records
   * @param loadedEntities Records loaded to resolve relations, shared with other calls for the same file
   * @returns The related records data by the id of the exported record,
   *          holding (possibly empty) related records for each valid config.
   *          Empty if the template does not include any related records.
   */
  async loadRelatedRecords(
    template: TemplateExport,
    records: Entity[],
    loadedEntities: LoadedEntitiesCache = new Map(),
  ): Promise<Map<string, RelatedRecordsData>> {
    if (!template.relatedRecords?.length) {
      return new Map();
    }

    const configs = this.filterValidConfigs(template);
    // collects the results: each config replaces its empty related records in the data with the loaded ones
    const exportedRecords: NestedRecord[] = records.map((record) => ({
      id: record.getId(),
      data: emptyRelatedRecords(configs),
    }));

    // each config writes its own related records into the records' data, so they can be loaded at the same time
    await Promise.all(
      configs.map((config) =>
        this.addRelatedRecords(
          template,
          config,
          exportedRecords,
          loadedEntities,
        ),
      ),
    );
    return new Map(exportedRecords.map((record) => [record.id, record.data]));
  }

  /**
   * The configs that can be applied, reporting the others: a record type or field that cannot
   * be part of a placeholder, or the same related records as an earlier config.
   */
  private filterValidConfigs(
    template: TemplateExport,
  ): TemplateExportRelatedRecords[] {
    const placeholders = new Set<string>();
    return template.relatedRecords.filter((config) => {
      if (!canBeUsedInPlaceholder(config)) {
        this.reportInvalidConfig(
          template,
          config,
          "record type or field cannot be used in a placeholder",
        );
        return false;
      }
      const placeholder = getRelatedRecordsPlaceholder(config);
      if (placeholders.has(placeholder)) {
        this.reportInvalidConfig(
          template,
          config,
          "related records are included more than once",
        );
        return false;
      }
      placeholders.add(placeholder);
      return true;
    });
  }

  /**
   * Load the related records of one config and add them to the data
   * of the exported records.
   *
   * @param template The template, to report an invalid config
   * @param config Which records to load and where to put them
   * @param exportedRecords The exported records, collecting the results in their `data`
   *          (starting with empty related records, shared with the other configs)
   * @param loadedEntities Records loaded to resolve relations, shared by all configs and levels
   */
  private async addRelatedRecords(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
    exportedRecords: NestedRecord[],
    loadedEntities: LoadedEntitiesCache,
  ) {
    const linkField = this.linkField(template, config);
    if (!linkField) {
      return;
    }

    try {
      // deliberately also for exported records of a type the field does not link to
      // (a template can apply to several types): no record links to them, so they keep empty related records,
      // and filtering them out first would only add code to save a few keys in one query
      await this.fillRelatedRecords(config, exportedRecords, loadedEntities);
    } catch (error) {
      // the file is still generated, with the related records that could be loaded
      Logging.warn(
        "TemplateExport: could not load related records",
        { template: template.getId(), config },
        error,
      );
    }
  }

  /**
   * Load the related records of each of the given records and write them into its data,
   * and in the same way the related records of those, down to the configured number of levels.
   *
   * @param config Which records to load and where to write them
   * @param records The records to fill, collecting the results in their `data`
   *          (the exported records at level 1, the related records of the level above below that)
   * @param loadedEntities Records loaded to resolve relations, shared by all configs and levels
   * @param level The level of the related records to load
   */
  private async fillRelatedRecords(
    config: TemplateExportRelatedRecords,
    records: NestedRecord[],
    loadedEntities: LoadedEntitiesCache,
    level = 1,
  ): Promise<void> {
    const relatedType = this.entityRegistry.get(config.entityType);
    if (
      level > getRelatedRecordsLevels(config, relatedType) ||
      records.length === 0
    ) {
      return;
    }

    const linking = await this.loadLinkingRecords(config, records);
    const dataById = await this.resolveRecords(
      config,
      [...linking.values()].flat(),
      loadedEntities,
    );

    const related: NestedRecord[] = [];
    for (const record of records) {
      const relatedOfRecord = relatedRecordsOf(
        record,
        linking.get(record.id) ?? [],
        dataById,
      );
      setRelatedRecords(
        record.data,
        config,
        relatedOfRecord.map((item) => item.data),
      );
      related.push(...relatedOfRecord);
    }

    // the related records get their own related records in the same way
    await this.fillRelatedRecords(config, related, loadedEntities, level + 1);
  }

  /**
   * The records linking to each of the given records, by its id,
   * without archived ones (unless configured).
   */
  private async loadLinkingRecords(
    config: TemplateExportRelatedRecords,
    records: NestedRecord[],
  ): Promise<Map<string, Entity[]>> {
    const linking = await this.entityRelations.loadLinkingToEntities(
      records.map((record) => record.id),
      this.entityRegistry.get(config.entityType),
      config.property,
    );
    if (!config.includeArchived) {
      linking.forEach((entities, id) =>
        linking.set(
          id,
          entities.filter((entity) => !entity.inactive),
        ),
      );
    }
    return linking;
  }

  /**
   * Plain copies of the given (already loaded) records, by their id,
   * in which the ids in link fields are replaced by the linked records.
   * The linked records are loaded from the database by the {@link EntityRelationResolverService},
   * each record type only once for all calls sharing `loadedEntities`.
   *
   * A plain link field back to the record they are related to is not resolved but holds only the ids (`{_id}`):
   * the details of that record are already available one level up, and resolving it would
   * load all records of its type and repeat them in every related record.
   * Embedded objects linking to it (e.g. attendance items) also hold other details
   * and are resolved like any other field.
   */
  private async resolveRecords(
    config: TemplateExportRelatedRecords,
    entities: Entity[],
    loadedEntities: LoadedEntitiesCache,
  ): Promise<Map<string, Record<string, unknown>>> {
    // a record related to several records is resolved only once
    const records = [
      ...new Map(entities.map((entity) => [entity.getId(), entity])).values(),
    ];
    const resolved = (await this.relationResolver.resolveRelations<unknown>(
      records,
      loadedEntities,
      { idsOnly: [config.property] },
    )) as Record<string, unknown>[];
    return new Map(records.map((entity, i) => [entity.getId(), resolved[i]]));
  }

  /**
   * The field of the related records that links to the exported records,
   * or `undefined` (reporting why) if it cannot be used for the template.
   */
  private linkField(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
  ): EntitySchemaField | undefined {
    const linkField = this.entityRegistry.has(config.entityType)
      ? this.entityRegistry.get(config.entityType).schema.get(config.property)
      : undefined;
    const allTypes = [...this.entityRegistry.keys()];
    if (!this.entityRelations.fieldReferencesType(linkField, allTypes)) {
      this.reportInvalidConfig(
        template,
        config,
        "unknown record type or link field",
      );
      return undefined;
    }

    const applicableTypes = template.applicableForEntityTypes ?? [];
    if (
      applicableTypes.length > 0 &&
      !this.entityRelations.fieldReferencesType(linkField, applicableTypes)
    ) {
      // e.g. the link field was changed to link to other record types after the template was set up
      this.reportInvalidConfig(
        template,
        config,
        "link field does not link to the applicable record types",
      );
      return undefined;
    }

    return linkField;
  }

  /**
   * Report a config that cannot be applied (e.g. because the data structure was changed after
   * the template was set up) - which someone has to correct in the template's settings.
   */
  private reportInvalidConfig(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
    reason: string,
  ) {
    const reportKey = [template.getId(), JSON.stringify(config), reason].join();
    if (this.reportedConfigs.has(reportKey)) {
      return;
    }
    this.reportedConfigs.add(reportKey);

    Logging.warn("TemplateExport: skipping invalid related records config", {
      reason,
      template: template.getId(),
      config,
    });
  }
}

/**
 * Whether the id is the given record or one it is related to (at any level),
 * i.e. adding it below the record would repeat a circular hierarchy.
 */
function isInBranch(record: NestedRecord | undefined, id: string): boolean {
  for (let current = record; current; current = current.relatedTo) {
    if (current.id === id) {
      return true;
    }
  }
  return false;
}

/**
 * The related records of the record, from the records linking to it:
 * sorted and without those that would repeat a circular hierarchy.
 */
function relatedRecordsOf(
  record: NestedRecord,
  entities: Entity[],
  dataById: Map<string, Record<string, unknown>>,
): NestedRecord[] {
  return entities
    .filter((entity) => !isInBranch(record, entity.getId()))
    .sort(compareByDisplayText)
    .map((entity) => ({
      id: entity.getId(),
      // an own copy, as a record linking to several records is a related record of each of them
      data: { ...dataById.get(entity.getId()) },
      relatedTo: record,
    }));
}

/**
 * The data of an exported record with empty related records for each config,
 * so that a loop in the template prints nothing rather than the unresolved placeholder itself.
 */
function emptyRelatedRecords(
  configs: TemplateExportRelatedRecords[],
): RelatedRecordsData {
  const data: RelatedRecordsData = {};
  configs.forEach((config) => setRelatedRecords(data, config, []));
  return data;
}

/**
 * Put the related records of the config into the record's data,
 * at the path of their placeholder (`_related.<entityType>.<property>`).
 */
function setRelatedRecords(
  data: RelatedRecordsData,
  config: TemplateExportRelatedRecords,
  relatedRecords: Record<string, unknown>[],
) {
  data[RELATED_RECORDS_PROPERTY] ??= {};
  data[RELATED_RECORDS_PROPERTY][config.entityType] ??= {};
  data[RELATED_RECORDS_PROPERTY][config.entityType][config.property] =
    relatedRecords;
}

function compareByDisplayText(a: Entity, b: Entity): number {
  return (
    a.toString().localeCompare(b.toString(), undefined, { numeric: true }) ||
    a.getId().localeCompare(b.getId())
  );
}
