import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";

export interface EntityPropertyMap {
  [key: string]: string | string[];
}

const INDEX_ID_PREFIX = "birthdayDashboard";

function toPropertyList(properties: string | string[]): string[] {
  return Array.isArray(properties) ? properties : [properties];
}

/**
 * Builds and identifies the PouchDB/CouchDB design doc that indexes entities by the cyclic
 * day-of-year of their date-of-birth propertie(s), so that entities with an upcoming birthday
 * can be queried efficiently without loading all entities of a type.
 */
@Injectable({
  providedIn: "root",
})
export class BirthdayDashboardIndexService {
  private dbIndexing = inject(DatabaseIndexingService);
  private entityRegistry = inject(EntityRegistry);

  /**
   * Build the design doc (with one view per configured entity type) that indexes entities
   * by the cyclic day-of-year of their date-of-birth propertie(s), so that entities with an
   * upcoming birthday can be queried efficiently without loading all entities of a type.
   */
  buildBirthdayIndex(entityConfig: EntityPropertyMap) {
    const views: Record<string, { map: string }> = {};
    for (const entityType of Object.keys(entityConfig).sort()) {
      const properties = toPropertyList(entityConfig[entityType])
        .slice()
        .sort();
      views[`by_${entityType}`] = {
        map: this.buildMapFunction(entityType, properties),
      };
    }
    return this.dbIndexing.createIndex({
      _id: `_design/${this.getIndexId(entityConfig)}`,
      views,
    });
  }

  /**
   * Query the birthday index for entities of the given type whose (cyclic) birthday falls
   * within `threshold` days from today - padded by one day on each side to account for the
   * index's reference-year-based approximation (e.g. around Feb 29 in leap years).
   */
  async queryBirthdayIndex(
    entityConfig: EntityPropertyMap,
    threshold: number,
  ): Promise<Map<string, Entity[]>> {
    const entitiesByType = new Map<string, Entity[]>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayOfYear = this.getCyclicDayOfYear(today);

    const promises = Object.keys(entityConfig).map((entityType) =>
      this.dbIndexing
        .queryIndexDocs(
          this.entityRegistry.get(entityType),
          this.getIndexViewName(entityConfig, entityType),
          {
            startkey: todayDayOfYear - 1,
            endkey: todayDayOfYear + threshold + 1,
          },
        )
        .then((docs) => entitiesByType.set(entityType, docs)),
    );
    await Promise.all(promises);
    return entitiesByType;
  }

  /**
   * Deterministic id for the design doc indexing the given entities/properties config.
   * Different widget configs (e.g. different dashboard instances) get their own design doc
   * so that their map functions don't overwrite each other.
   */
  private getIndexId(entityConfig: EntityPropertyMap): string {
    const configPart = Object.keys(entityConfig)
      .sort()
      .map((entityType) => {
        const properties = toPropertyList(entityConfig[entityType])
          .slice()
          .sort();
        return `${entityType}(${properties.join(",")})`;
      })
      .join("_");
    return `${INDEX_ID_PREFIX}_${configPart}`;
  }

  /** Name of the view (within the design doc) that indexes birthdays of the given entity type. */
  private getIndexViewName(
    entityConfig: EntityPropertyMap,
    entityType: string,
  ): string {
    return `${this.getIndexId(entityConfig)}/by_${entityType}`;
  }

  /**
   * Day-of-year (1-365) for the given date's month/day, computed against a fixed non-leap
   * reference year so that the same month/day always maps to the same cyclic key,
   * independent of the actual (birth) year and independent of leap years.
   */
  private getCyclicDayOfYear(date: Date): number {
    return (
      Math.floor(
        (Date.UTC(2001, date.getMonth(), date.getDate()) -
          Date.UTC(2001, 0, 1)) /
          86400000,
      ) + 1
    );
  }

  /**
   * Build the map function (as a string, to be run by PouchDB/CouchDB) that indexes documents
   * of the given entity type by the cyclic day-of-year of any of the given date-of-birth properties.
   *
   * The emitted key is the cyclic day-of-year (see {@link getCyclicDayOfYear}), duplicated at +365
   * so that range queries spanning a year boundary (e.g. "next 32 days" in late December) don't need
   * to wrap around manually. The emitted value is the raw property value (the date of birth).
   *
   * Only entities that are not `inactive` are indexed.
   */
  private buildMapFunction(entityType: string, properties: string[]): string {
    const propertyEmits = properties
      .map(
        (property) => `
        if (doc.${property}) {
          var raw = doc.${property};
          var month, day;
          if (typeof raw === "string" && raw.length >= 10) {
            month = parseInt(raw.substring(5, 7), 10);
            day = parseInt(raw.substring(8, 10), 10);
          } else {
            var parsed = new Date(raw);
            month = parsed.getMonth() + 1;
            day = parsed.getDate();
          }
          var dayOfYear = Math.floor((Date.UTC(2001, month - 1, day) - Date.UTC(2001, 0, 1)) / 86400000) + 1;
          emit(dayOfYear, raw);
          emit(dayOfYear + 365, raw);
        }`,
      )
      .join("\n");

    return `(doc) => {
    if (!doc._id.startsWith("${entityType}:")) return;
    if (doc.inactive) return;
    ${propertyEmits}
  }`;
  }
}
