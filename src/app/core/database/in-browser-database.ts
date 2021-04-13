import { LoggingService } from "../logging/logging.service";
import PouchDB from "pouchdb-browser";
import { PouchDatabase } from "./pouch-database";
import { deleteDB } from "idb";

export class InBrowserDatabase extends PouchDatabase {
  static create(
    dbname: string = "in-browser-database",
    loggingService: LoggingService = new LoggingService()
  ): InBrowserDatabase {
    return new InBrowserDatabase(new PouchDB(dbname), loggingService, dbname);
  }
  constructor(pouchDB, loggingService: LoggingService, private name: string) {
    super(pouchDB, loggingService);
  }

  async destroy(): Promise<any> {
    // @ts-ignore
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name.startsWith(this.name)) {
        console.log("deleting indexedDB", db.name);
        await deleteDB(db.name);
      }
    }
    return super.destroy();
  }
}
