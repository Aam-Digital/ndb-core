import { inject, Injectable } from "@angular/core";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { EntityRelationResolverService } from "#src/app/core/entity/entity-relation-resolver/entity-relation-resolver.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { TemplateExport } from "../template-export.entity";
import {
  getRelatedRecordsLevels,
  isFieldLinkingToType,
  RELATED_RECORDS_KEY_PATTERN,
  TemplateExportRelatedRecords,
} from "./template-export-related-records";

/**
 * The lists of related records to be added to the data of one exported record,
 * by the `key` of their {@link TemplateExportRelatedRecords} config.
 */
export type RelatedRecordsData = Record<string, Record<string, unknown>[]>;

/**
 * A record placed in the hierarchy of related records of an exported record.
 */
interface HierarchyNode {
  id: string;
  /** the object the related records of this record are added to */
  data: Record<string, unknown>;
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
   * @returns The related records data by the id of the exported record,
   *          holding a (possibly empty) list for each validly configured key.
   *          Empty if the template does not include any related records.
   */
  async loadRelatedRecords(
    template: TemplateExport,
    records: Entity[],
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

    for (const config of configs) {
      await this.addRelatedRecords(
        template,
        config,
        [...uniqueRecords.values()],
        result,
      );
    }
    return result;
  }

  /**
   * Load the records of one config and add them to the result of each record.
   */
  private async addRelatedRecords(
    template: TemplateExport,
    config: TemplateExportRelatedRecords,
    records: Entity[],
    result: Map<string, RelatedRecordsData>,
  ) {
    if (!RELATED_RECORDS_KEY_PATTERN.test(config?.key ?? "")) {
      this.reportInvalidConfig(template, config, "invalid placeholder name");
      return;
    }

    // records to load related records for, level by level
    let parents: HierarchyNode[] = [];
    for (const record of records) {
      if (record.getSchema().has(config.key)) {
        // never hide an actual field of the record behind the list
        this.reportInvalidConfig(
          template,
          config,
          "placeholder name is a field of the record type",
        );
        continue;
      }

      const data = result.get(record.getId());
      // always provide a list, so that a loop in the template prints nothing
      // rather than the unresolved placeholder itself
      data[config.key] = [];
      parents.push({ id: record.getId(), data });
    }

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

    const levels = getRelatedRecordsLevels(config, relatedType);
    for (let level = 1; level <= levels && parents.length > 0; level++) {
      parents = await this.addLevel(config, relatedType, parents);
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
  ): Promise<HierarchyNode[]> {
    const linking = await this.entityRelations.loadLinkingToEntities(
      parents.map((parent) => parent.id),
      relatedType,
      config.property,
    );

    const related = new Map<string, Entity>();
    for (const entities of linking.values()) {
      entities
        .filter((entity) => !entity.inactive)
        .forEach((entity) => related.set(entity.getId(), entity));
    }
    const sorted = [...related.values()].sort(compareByDisplayText);
    const resolved: Record<string, unknown>[] =
      await this.relationResolver.resolveRelations<any>(sorted);
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

      parent.data[config.key] = childIds.map((id) => {
        // an own copy, as a record linking to several parents gets a separate list of related records for each
        const child = { id, data: { ...dataById.get(id) }, parent };
        children.push(child);
        return child.data;
      });
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

function compareByDisplayText(a: Entity, b: Entity): number {
  return (
    a.toString().localeCompare(b.toString(), undefined, { numeric: true }) ||
    a.getId().localeCompare(b.getId())
  );
}
