import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { inject, Injectable } from "@angular/core";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { Note } from "../../model/note";

const INDEX_ID_PREFIX = "importantNotesDashboard";
const VIEW_NAME = "importantNotes";
const WARNING_LEVEL_ENUM_ID = "warning-levels";

/**
 * Builds and identifies the PouchDB/CouchDB view that indexes Notes by the ordinal
 * position of their `warningLevel` (highest ordinal - most urgent - first), restricted
 * to a configured set of relevant warning level ids, so that important notes can be
 * queried page-by-page without loading all Notes.
 *
 * Note: the ordinal-position lookup is a snapshot of the "warning-levels" enum
 * configuration at the time `buildIndex` runs. If that enum's configured order is later
 * changed by an admin, this index needs to be rebuilt (via `buildIndex`) to reflect it -
 * it does not update itself automatically.
 */
@Injectable({
  providedIn: "root",
})
export class ImportantNotesIndexService {
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly configurableEnumService = inject(ConfigurableEnumService);

  /**
   * Build the design doc/view indexing Notes by warningLevel ordinal, restricted to the
   * given relevant warning level ids.
   */
  buildIndex(relevantWarningLevels: string[]) {
    return this.dbIndexing.createIndex({
      _id: `_design/${this.getIndexId(relevantWarningLevels)}`,
      views: {
        [VIEW_NAME]: {
          map: this.buildMapFunction(relevantWarningLevels),
        },
      },
    });
  }

  /**
   * Query one page of important Notes (highest warningLevel ordinal first), restricted
   * to the given relevant warning level ids.
   */
  async queryIndex(
    relevantWarningLevels: string[],
    skip: number,
    limit: number,
  ): Promise<Note[]> {
    return this.dbIndexing.queryIndexDocs(
      Note,
      `${this.getIndexId(relevantWarningLevels)}/${VIEW_NAME}`,
      {
        descending: true,
        skip,
        limit,
      },
    );
  }

  /**
   * Deterministic id for the design doc indexing the given relevant warning levels.
   * Different widget configs get their own design doc so their map functions don't
   * overwrite each other.
   */
  private getIndexId(relevantWarningLevels: string[]): string {
    const configPart = relevantWarningLevels.slice().sort().join(",");
    return `${INDEX_ID_PREFIX}_${configPart}`;
  }

  /**
   * Build the map function (as a string, to be run by PouchDB/CouchDB) that indexes
   * Note documents whose `warningLevel` is one of the relevant ids, keyed by that
   * level's ordinal position (so a `descending: true` query naturally returns the most
   * urgent notes first).
   */
  private buildMapFunction(relevantWarningLevels: string[]): string {
    const ordinalById = this.getOrdinalLookup();
    return `(doc) => {
    if (!doc._id.startsWith("Note:")) return;
    var relevantLevels = ${JSON.stringify(relevantWarningLevels)};
    if (relevantLevels.indexOf(doc.warningLevel) === -1) return;
    var ordinalById = ${JSON.stringify(ordinalById)};
    var ordinal = ordinalById[doc.warningLevel];
    if (ordinal === undefined) return;
    emit(ordinal);
  }`;
  }

  /** Snapshot of each configured warning level's ordinal (its position in the enum). */
  private getOrdinalLookup(): Record<string, number> {
    const values = this.configurableEnumService.getEnumValues(
      WARNING_LEVEL_ENUM_ID,
    );
    const ordinalById: Record<string, number> = {};
    values.forEach((value, index) => {
      ordinalById[String(value.id)] = value["_ordinal"] ?? index;
    });
    return ordinalById;
  }
}
