import { AppConfig } from "../../app-config/app-config";
import { SessionService } from "./session.service";
import { PouchDatabase } from "../../database/pouch-database";
import { SessionType } from "../session-type";

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
      await this.removeDesignDocs(oldDB);
      await this.syncDatabase(oldPouch);
    }
    await oldPouch.destroy();
  }

  private syncDatabase(oldPouch: PouchDB.Database): Promise<any> {
    const newDB = this.sessionService.getDatabase() as PouchDatabase;
    return newDB.getPouchDB().replicate.from(oldPouch, { batch_size: 500 });
  }

  private async removeDesignDocs(database: PouchDatabase): Promise<void> {
    const designDocs = await database.getAll("_design/");
    const removePromises = designDocs.map((doc) => database.remove(doc));
    await Promise.all(removePromises);
  }
}
