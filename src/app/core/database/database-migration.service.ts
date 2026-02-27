import { Injectable } from "@angular/core";
import { Database } from "./database";
import { Logging } from "#src/app/core/logging/logging.service";
import { migrateNoteAttendance } from "#src/app/features/attendance/deprecated/note-children-attendance-migration";

/**
 * A database document migration function.
 * Receives a raw PouchDB document and returns the (possibly transformed) document.
 * Must return the original object reference unchanged if no migration applies.
 */
export type DatabaseMigration = (rawDoc: any) => any;

/**
 * Centralized service for running one-time raw-document migrations on the database.
 *
 * Register migration functions in the `migrations` array.
 * Each function receives a raw document and returns it transformed (or unchanged).
 * Safe to run repeatedly — migrations should be idempotent.
 *
 * Follows the same registry pattern as {@link ConfigService.applyMigrations}.
 */
@Injectable({ providedIn: "root" })
export class DatabaseMigrationService {
  private readonly migrations: DatabaseMigration[] = [migrateNoteAttendance];

  /**
   * Run all registered migrations in the background (non-blocking).
   * Errors are logged but do not throw.
   */
  runMigrations(db: Database): void {
    this.applyMigrations(db).catch((err) =>
      Logging.error("DatabaseMigration failed", err),
    );
  }

  async applyMigrations(db: Database): Promise<void> {
    const allDocs = await db.getAll();

    const toUpdate: any[] = [];
    for (const doc of allDocs) {
      let migrated = doc;
      for (const migration of this.migrations) {
        migrated = migration(migrated);
      }
      if (migrated !== doc) {
        toUpdate.push(migrated);
      }
    }

    if (toUpdate.length === 0) {
      Logging.debug("DatabaseMigration: no documents required migration");
      return;
    }

    await db.putAll(toUpdate);
    Logging.log(`DatabaseMigration: migrated ${toUpdate.length} document(s)`);
  }
}
