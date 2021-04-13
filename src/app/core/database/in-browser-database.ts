import { LoggingService } from "../logging/logging.service";
import PouchDB from "pouchdb-browser";
import { PouchDatabase } from "./pouch-database";

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
}
