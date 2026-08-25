import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";

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
const VIEW_NAME = "birthday";

function toPropertyList(properties: string | string[]): string[] {
  return Array.isArray(properties) ? properties : [properties];
}

/**
 * Builds and identifies the single PouchDB/CouchDB view that indexes entities of all
 * configured types by the cyclic day-of-year of their date-of-birth propertie(s), so
 * that entities with an upcoming birthday can be queried efficiently without loading
 * all entities of any type.
 */
@Injectable({
  providedIn: "root",
})
export class BirthdayDashboardIndexService {
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entitySchemaService = inject(EntitySchemaService);

  buildBirthdayIndex(entityConfig: EntityPropertyMap) {
    return this.dbIndexing.createIndex({
      _id: `_design/${this.getIndexId(entityConfig)}`,
      views: {
        [VIEW_NAME]: {
          map: this.buildMapFunction(entityConfig),
        },
      },
    });
  }

  /**
   * Query the birthday index for entities of any configured type whose (real calendar)
   * birthday falls within `threshold` days from today.
   *
   * The underlying range query is padded by one day on each side to account for the
   * index's reference-year-based cyclic-day-of-year approximation (e.g. around Feb 29
   * in leap years). That padding can also pull in rows that don't actually belong (e.g.
   * a birthday that was yesterday, or one day beyond the threshold), so the results are
   * re-filtered afterward using the exact, real calendar day difference (see
   * {@link daysUntil}) to drop those before returning.
   */
  async queryBirthdayIndex(
    entityConfig: EntityPropertyMap,
    threshold: number,
  ): Promise<EntityWithBirthday[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayOfYear = this.getCyclicDayOfYear(today);

    const result = await this.dbIndexing.queryIndexRaw(
      `${this.getIndexId(entityConfig)}/${VIEW_NAME}`,
      {
        startkey: todayDayOfYear - 1,
        endkey: todayDayOfYear + threshold + 1,
        include_docs: true,
      },
    );

    return result.rows
      .filter((row) => daysUntil(new Date(row.value), today) <= threshold)
      .map((row) => {
        const entityType = Entity.extractTypeFromId(row.doc._id);
        const entityConstructor = this.entityRegistry.get(entityType);
        const entity = new entityConstructor("");
        this.entitySchemaService.loadDataIntoEntity(entity, row.doc);
        const dateOfBirth = new Date(row.value);
        const birthday = getNextOccurrence(dateOfBirth, today);
        return {
          entity,
          birthday,
          newAge: birthday.getFullYear() - dateOfBirth.getFullYear(),
        };
      });
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
   * Build the map function (as a string, to be run by PouchDB/CouchDB) that indexes
   * documents of every configured entity type by the cyclic day-of-year of any of their
   * configured date-of-birth properties.
   *
   * The emitted key is the cyclic day-of-year (see {@link getCyclicDayOfYear}), duplicated at +365
   * so that range queries spanning a year boundary (e.g. "next 32 days" in late December) don't need
   * to wrap around manually. The emitted value is the raw property value (the date of birth).
   *
   * Only entities that are not `inactive` are indexed.
   */
  private buildMapFunction(entityConfig: EntityPropertyMap): string {
    const typeBlocks = Object.keys(entityConfig)
      .sort()
      .map((entityType) => {
        const properties = toPropertyList(entityConfig[entityType])
          .slice()
          .sort();
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

        return `
      if (doc._id.startsWith("${entityType}:")) {
        ${propertyEmits}
      }`;
      })
      .join("\n");

    return `(doc) => {
    if (doc.inactive) return;
    ${typeBlocks}
  }`;
  }
}

/**
 * Real calendar date of the next occurrence (this year, or next year if it has already
 * passed) of the given date's month/day, relative to `today`.
 */
export function getNextOccurrence(date: Date, today: Date): Date {
  const next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (today.getTime() > next.getTime()) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

/**
 * Exact number of real calendar days from `today` until the next occurrence of the
 * given date's month/day.
 */
export function daysUntil(date: Date, today: Date): number {
  const next = getNextOccurrence(date, today);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}
