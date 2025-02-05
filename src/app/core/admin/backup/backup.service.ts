import { Injectable } from "@angular/core";
import { Database } from "../../database/database";
import { Config } from "../../config/config";
import { DatabaseResolverService } from "../../database/database-resolver.service";

/**
 * Create and load backups of the database.
 */
@Injectable({
  providedIn: "root",
})
export class BackupService {
  private db: Database;

  constructor(private dbResolver: DatabaseResolverService) {
    this.db = this.dbResolver.getDatabase();
    // WARNING: currently only the default "app" database is backed up
  }

  /**
   * Creates an array holding all elements of the database.
   * This method can be used to create a backup of the data.
   */
  async getDatabaseExport(): Promise<any[]> {
    return await this.db.getAll();
  }

  /**
   * Removes all but the config of the database
   *
   * @returns Promise<any> a promise that resolves after all remove operations are done
   */
  async clearDatabase(): Promise<void> {
    const allDocs = await this.db.getAll();
    for (const row of allDocs) {
      if (row._id.startsWith(Config.ENTITY_TYPE + ":")) {
        // skip config in order to not break login!
        continue;
      }
      await this.db.remove(row);
    }
  }

  /**
   * Fills the database with the provided JSON data.
   * Data should be generated by the `getJsonExport` function
   *
   * @param documents An array of documents/raw entities to be directly written to the database
   * @param forceUpdate should existing objects be overridden? Default false
   */
  async restoreData(documents: any[], forceUpdate = false): Promise<void> {
    for (const record of documents) {
      // Remove _rev so CouchDB treats it as a new rather than a updated document
      delete record._rev;
      await this.db.put(record, forceUpdate);
    }
  }
}
