import { Injectable } from "@angular/core";
import { AppConfig } from "../../app-config/app-config";
import { SessionService } from "./session.service";
import { PouchDatabase } from "../../database/pouch-database";
import { SessionType } from "../session-type";

@Injectable()
export class DatabaseMigrationService {
  constructor(private sessionService: SessionService) {}

  async migrateToDatabasePerUser(): Promise<void> {
    const oldDBName = AppConfig.settings.database.name;
    const oldDB = new PouchDatabase();
    if (AppConfig.settings.session_type === SessionType.mock) {
      oldDB.initInMemoryDB(oldDBName);
    } else {
      oldDB.initIndexedDB(oldDBName);
    }
    const oldPouch = oldDB.getPouchDB();
    const info = await oldPouch.info();
    if (info.doc_count > 0) {
      const newDB = this.sessionService.getDatabase() as PouchDatabase;
      await newDB.getPouchDB().replicate.from(oldPouch, { batch_size: 500 });
    }
    await oldPouch.destroy();
  }
}
