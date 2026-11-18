import { inject, Injectable } from "@angular/core";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import {
  EntityRelationResolverService,
  LoadedEntitiesCache,
} from "#src/app/core/entity/entity-relation-resolver/entity-relation-resolver.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { TemplateExport } from "../template-export.entity";
import {
  getRelatedRecordsLevels,
  isFieldLinkingToType,
  RELATED_RECORDS_KEY_PATTERN,
  RELATED_RECORDS_PROPERTY,
  TemplateExportRelatedRecords,
} from "./template-export-related-records";

/**
 * The data to add to one exported record: the lists of related records
 * by the `key` of their {@link TemplateExportRelatedRecords} config,
 * under {@link RELATED_RECORDS_PROPERTY} so that they never hide a field of the record.
 */
export type RelatedRecordsData = {
  [RELATED_RECORDS_PROPERTY]?: Record<string, Record<string, unknown>[]>;
};

/**
 * A record placed in the hierarchy of related records of an exported record.
 */
interface HierarchyNode {
  id: string;
  /** the record's data, to which its related records are added */
  data: RelatedRecordsData;
  parent?: HierarchyNode;
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
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly relationResolver = inject(EntityRelationResolverService);
  private readonly entityRegistry = inject(EntityRegistry);

  /** configs already reported as invalid, to report each only once per session */
  private readonly reportedConfigs = new Set<string>();

  /**
   * Load the related records configured for the template, for each of the given records.
   *
   * Related records are returned as plain copies with their own entity-reference fields
   * resolved one level deep (like the exported record itself), excluding archived records
   * and sorted by their display text.
   *
   * @param template The template whose `relatedRecords` config defines what to load
   * @param records The records a file is generated for
   * @param loadedEntities Records already loaded to resolve relations, shared with other calls
   *          for the same file (each level of a hierarchy refers to the records of the level above)
   * @returns The related records data by the id of the exported record,
   *          holding a (possibly empty) list for each validly configured key.
   *          Empty if the template does not include any related records.
   */
  async loadRelatedRecords(
    template: TemplateExport,
    records: Entity[],
    loadedEntities: LoadedEntitiesCache = new Map(),
  ): Promise<Map<string, RelatedRecordsData>> {
    const result = new Map<string, RelatedRecordsData>();
    const configs = template.relatedRecords ?? [];
    if (configs.length === 0 || records.length === 0) {
      return result;
    }

    const uniqueRecords = new Map(records.map((r) => [r.getId(), r]));
    for (const id of uniqueRecords.keys()) {
      result.set(id, {});
    }

    // each config adds its own key to the records' data, so they can be loaded at the same time
    await Promise.all(
      this.withoutDuplicateKeys(template, configs).map((config) =>
        this.addRelatedRecords(
          template,
          config,
          [...uniqueRecords.values()],
          result,
          loadedEntities,
        ),
      ),
    );
    return result;
  }

  /**
   * Skip (and report) configs that use the placeholder name of an earlier config,
   * which would otherwise silently replace the earlier list.
   */
  private withoutDuplicateKeys(
    template: TemplateExport,
    configs: TemplateExportRelatedRecords[],
  ): TemplateExportRelatedRecords[] {
    const keys = new Set<string>();
    return configs.filter((config) => {
      if (config?.key && keys.has(config.key)) {
        this.reportInvalidConfig(
          template,
          config,
          "placeholder name is used more than once",
        );
        return false;
      }
      keys.add(config?.key);
      return true;
    });
  }

  /**
   * Load the records of one config and add them to the result of each record.
   */
  private async addRelatedRecords(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
    records: Entity[],
    result: Map<string, RelatedRecordsData>,
    loadedEntities: LoadedEntitiesCache,
  ) {
    if (!RELATED_RECORDS_KEY_PATTERN.test(config?.key ?? "")) {
      this.reportInvalidConfig(template, config, "invalid placeholder name");
      return;
    }

    // records to load related records for, level by level
    let parents: HierarchyNode[] = records.map((record) => {
      const data = result.get(record.getId());
      // always provide a list, so that a loop in the template prints nothing
      // rather than the unresolved placeholder itself
      setRelatedList(data, config.key, []);
      return { id: record.getId(), data };
    });

    const relatedType = this.entityRegistry.has(config.entityType)
      ? this.entityRegistry.get(config.entityType)
      : undefined;
    const linkField = relatedType?.schema.get(config.property);
    if (!relatedType || linkField?.dataType !== "entity") {
      this.reportInvalidConfig(
        template,
        config,
        "unknown record type or link field",
      );
      return;
    }

    // a template can apply to several record types, not all of which this field may link to
    parents = parents.filter((parent) =>
      isFieldLinkingToType(linkField, Entity.extractTypeFromId(parent.id)),
    );

    const loadLinking = this.createLinkingLoader(relatedType, config.property);
    const levels = getRelatedRecordsLevels(config, relatedType);
    for (let level = 1; level <= levels && parents.length > 0; level++) {
      parents = await this.addLevel(
        config,
        loadLinking,
        parents,
        loadedEntities,
      );
    }
  }

  /**
   * Look up the records linking to given ids through the field, level by level.
   * Without database queries every lookup needs all records of the type,
   * so these are then loaded only once for all levels.
   */
  private createLinkingLoader(
    relatedType: EntityConstructor,
    property: string,
  ): (ids: string[]) => Promise<Map<string, Entity[]>> {
    let allRecords: Promise<Entity[]> | undefined;
    return async (ids) => {
      if (!this.entityMapper.supportsFind(relatedType)) {
        allRecords ??= this.entityMapper.loadType(relatedType);
      }
      return this.entityRelations.loadLinkingToEntities(
        ids,
        relatedType,
        property,
        await allRecords,
      );
    };
  }

  /**
   * Load the records linking to the given parents and add them to their data.
   * @returns The added records, as the parents of the next level
   */
  private async addLevel(
    config: TemplateExportRelatedRecords,
    loadLinking: (ids: string[]) => Promise<Map<string, Entity[]>>,
    parents: HierarchyNode[],
    loadedEntities: LoadedEntitiesCache,
  ): Promise<HierarchyNode[]> {
    const linking = await loadLinking(parents.map((parent) => parent.id));

    const related = new Map<string, Entity>();
    for (const entities of linking.values()) {
      entities
        .filter((entity) => !entity.inactive)
        .forEach((entity) => related.set(entity.getId(), entity));
    }
    const sorted = [...related.values()].sort(compareByDisplayText);
    // plain copies of the records (with their relations resolved)
    const resolved = (await this.relationResolver.resolveRelations<unknown>(
      sorted,
      loadedEntities,
    )) as Record<string, unknown>[];
    const dataById = new Map<string, Record<string, unknown>>(
      sorted.map((entity, i) => [entity.getId(), resolved[i]]),
    );
    const sortIndex = new Map(sorted.map((entity, i) => [entity.getId(), i]));

    const children: HierarchyNode[] = [];
    for (const parent of parents) {
      const childIds = (linking.get(parent.id) ?? [])
        .map((entity) => entity.getId())
        .filter((id) => dataById.has(id) && !isInBranch(parent, id))
        .sort((a, b) => sortIndex.get(a) - sortIndex.get(b));

      const list = childIds.map((id) => {
        // an own copy, as a record linking to several parents gets a separate list of related records for each
        const child = {
          id,
          data: withParentAsId(dataById.get(id), config.property, parent.id),
          parent,
        };
        children.push(child);
        return child.data;
      });
      setRelatedList(parent.data, config.key, list);
    }
    return children;
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
 * Whether the record is the given node or one of its ancestors,
 * i.e. adding it below the node would repeat a circular hierarchy.
 */
function isInBranch(node: HierarchyNode | undefined, id: string): boolean {
  for (let current = node; current; current = current.parent) {
    if (current.id === id) {
      return true;
    }
  }
  return false;
}

function setRelatedList(
  data: RelatedRecordsData,
  key: string,
  list: Record<string, unknown>[],
) {
  data[RELATED_RECORDS_PROPERTY] ??= {};
  data[RELATED_RECORDS_PROPERTY][key] = list;
}

/**
 * A copy of the related record's data in which the link to the record it is listed under
 * holds only that record's id: its details are already available one level up,
 * and repeating them in every list item would multiply the size of the request.
 * Other records linked through the same field stay resolved.
 */
function withParentAsId(
  data: Record<string, unknown>,
  property: string,
  parentId: string,
): Record<string, unknown> & RelatedRecordsData {
  const shorten = (linked: unknown) =>
    (linked as { _id?: string })?._id === parentId ? { _id: parentId } : linked;
  const value = data[property];
  return {
    ...data,
    [property]: Array.isArray(value) ? value.map(shorten) : shorten(value),
  };
}

function compareByDisplayText(a: Entity, b: Entity): number {
  return (
    a.toString().localeCompare(b.toString(), undefined, { numeric: true }) ||
    a.getId().localeCompare(b.getId())
  );
}
