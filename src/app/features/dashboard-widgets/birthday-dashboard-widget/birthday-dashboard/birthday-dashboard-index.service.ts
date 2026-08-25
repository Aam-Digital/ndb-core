import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { calculateAge } from "#src/app/utils/utils";

export interface EntityPropertyMap {
  [key: string]: string | string[];
}

/**
 * One entity paired with the next occurrence of a single one of its configured
 * birthday properties. An entity with several matching birthday properties is
 * represented by several `EntityWithBirthday` entries (one per matching property),
 * mirroring the underlying index which emits one row per (entity, property) match.
 */
export interface EntityWithBirthday {
  entity: Entity;
  birthday: Date;
  newAge: number;
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
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entitySchemaService = inject(EntitySchemaService);

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
   *
   * Builds the `EntityWithBirthday` result directly from the index's rows (one row per
   * matching (entity, property) pair), rather than returning raw entities that a caller
   * would have to re-match against the configured properties - re-matching against every
   * configured property independently would multiply an entity's rows by the number of
   * configured properties, producing duplicate/incorrect entries whenever more than one
   * property matches.
   */
  async queryBirthdayIndex(
    entityConfig: EntityPropertyMap,
    threshold: number,
  ): Promise<Map<string, EntityWithBirthday[]>> {
    const entitiesByType = new Map<string, EntityWithBirthday[]>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayOfYear = this.getCyclicDayOfYear(today);

    const promises = Object.keys(entityConfig).map((entityType) => {
      const entityConstructor = this.entityRegistry.get(entityType);
      return this.dbIndexing
        .queryIndexRaw(this.getIndexViewName(entityConfig, entityType), {
          startkey: todayDayOfYear - 1,
          endkey: todayDayOfYear + threshold + 1,
          include_docs: true,
        })
        .then((result) => {
          const entries: EntityWithBirthday[] = result.rows.map((row) => {
            const entity = new entityConstructor("");
            this.entitySchemaService.loadDataIntoEntity(entity, row.doc);
            const dateOfBirth = new Date(row.value);
            return {
              entity,
              birthday: this.getNextOccurrence(dateOfBirth, today),
              newAge: calculateAge(dateOfBirth) + 1,
            };
          });
          entitiesByType.set(entityType, entries);
        });
    });
    await Promise.all(promises);
    return entitiesByType;
  }

  /**
   * Real calendar date of the next occurrence (this year, or next year if it has already
   * passed) of the given date's month/day, relative to `today`.
   */
  private getNextOccurrence(date: Date, today: Date): Date {
    const next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    if (today.getTime() > next.getTime()) {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next;
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
