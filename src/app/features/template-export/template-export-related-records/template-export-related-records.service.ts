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
  canBeUsedInPlaceholder,
  getRelatedRecordsPlaceholder,
  RELATED_RECORDS_PROPERTY,
  TemplateExportRelatedRecords,
} from "./template-export-related-records";

/**
 * The data to add to one exported record: the lists of related records
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
   * Related records are plain copies with their own entity-reference fields resolved
   * one level deep (like the exported record itself), excluding archived records
   * and sorted by their display text.
   *
   * @param loadedEntities Records already loaded to resolve relations, shared with other calls
   *          for the same file (each level of a hierarchy refers to the records of the level above)
   * @returns The related records data by the id of the exported record,
   *          holding a (possibly empty) list for each valid config.
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

    const result = new Map<string, RelatedRecordsData>();
    records.forEach((record) => result.set(record.getId(), {}));

    // each config adds its own list to the records' data, so they can be loaded at the same time
    await Promise.all(
      this.validConfigs(template).map((config) =>
        this.addRelatedRecords(template, config, result, loadedEntities),
      ),
    );
    return result;
  }

  /**
   * The configs that can be applied, reporting the others: a record type or field that cannot
   * be part of a placeholder, or the same related records as an earlier config.
   */
  private validConfigs(
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
   * Load the records of one config, level by level, and add them to the data of each record.
   */
  private async addRelatedRecords(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
    result: Map<string, RelatedRecordsData>,
    loadedEntities: LoadedEntitiesCache,
  ) {
    // always provide a list, so that a loop in the template prints nothing
    // rather than the unresolved placeholder itself
    let parents: HierarchyNode[] = [...result].map(([id, data]) => {
      setRelatedList(data, config, []);
      return { id, data };
    });

    const relatedType = this.entityRegistry.has(config.entityType)
      ? this.entityRegistry.get(config.entityType)
      : undefined;
    const linkField = relatedType?.schema.get(config.property);
    if (linkField?.dataType !== "entity") {
      this.reportInvalidConfig(
        template,
        config,
        "unknown record type or link field",
      );
      return;
    }

    const applicableTypes = template.applicableForEntityTypes ?? [];
    if (
      applicableTypes.length > 0 &&
      !isFieldLinkingToType(linkField, ...applicableTypes)
    ) {
      // e.g. the link field was changed to link to other record types after the template was set up
      this.reportInvalidConfig(
        template,
        config,
        "link field does not link to the applicable record types",
      );
      return;
    }

    // a template can apply to several record types, not all of which this field may link to
    parents = parents.filter((parent) =>
      isFieldLinkingToType(linkField, Entity.extractTypeFromId(parent.id)),
    );
    if (parents.length === 0) {
      return;
    }

    // without database queries every level needs all records of the type: load them only once
    const allRecords = this.entityMapper.supportsFind(relatedType)
      ? undefined
      : await this.entityMapper.loadType(relatedType);
    const levels = getRelatedRecordsLevels(config, relatedType);
    for (let level = 1; level <= levels && parents.length > 0; level++) {
      parents = await this.addLevel(config, relatedType, parents, {
        allRecords,
        loadedEntities,
      });
    }
  }

  /**
   * Load the records linking to the given parents and add them to their data.
   * @returns The added records, as the parents of the next level
   */
  private async addLevel(
    config: TemplateExportRelatedRecords,
    relatedType: EntityConstructor,
    parents: HierarchyNode[],
    loaded: { allRecords?: Entity[]; loadedEntities: LoadedEntitiesCache },
  ): Promise<HierarchyNode[]> {
    const linking = await this.entityRelations.loadLinkingToEntities(
      parents.map((parent) => parent.id),
      relatedType,
      config.property,
      loaded.allRecords,
    );
    const dataById = await this.resolveActiveRecords(
      [...linking.values()].flat(),
      loaded.loadedEntities,
    );

    const children: HierarchyNode[] = [];
    for (const parent of parents) {
      const list = (linking.get(parent.id) ?? [])
        .filter((entity) => dataById.has(entity.getId()))
        .filter((entity) => !isInBranch(parent, entity.getId()))
        .sort(compareByDisplayText)
        .map((entity) => {
          // an own copy, as a record linking to several parents gets a separate list for each
          const data = withParentAsId(
            dataById.get(entity.getId()),
            config.property,
            parent.id,
          );
          children.push({ id: entity.getId(), data, parent });
          return data;
        });
      setRelatedList(parent.data, config, list);
    }
    return children;
  }

  /**
   * Plain copies of the records that are not archived, with their relations resolved, by their id.
   */
  private async resolveActiveRecords(
    entities: Entity[],
    loadedEntities: LoadedEntitiesCache,
  ): Promise<Map<string, Record<string, unknown>>> {
    const active = [
      ...new Map(
        entities
          .filter((entity) => !entity.inactive)
          .map((entity) => [entity.getId(), entity]),
      ).values(),
    ];
    const resolved = (await this.relationResolver.resolveRelations<unknown>(
      active,
      loadedEntities,
    )) as Record<string, unknown>[];
    return new Map(active.map((entity, i) => [entity.getId(), resolved[i]]));
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
  config: TemplateExportRelatedRecords,
  list: Record<string, unknown>[],
) {
  data[RELATED_RECORDS_PROPERTY] ??= {};
  data[RELATED_RECORDS_PROPERTY][config.entityType] ??= {};
  data[RELATED_RECORDS_PROPERTY][config.entityType][config.property] = list;
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
