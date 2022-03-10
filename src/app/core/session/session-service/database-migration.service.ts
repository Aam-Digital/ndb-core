import { AppConfig } from "../../app-config/app-config";
import { PouchDatabase } from "../../database/pouch-database";
import { SessionType } from "../session-type";
import { AnalyticsService } from "../../analytics/analytics.service";
import { Inject, Injectable } from "@angular/core";
import { LoggingService } from "../../logging/logging.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";

@Injectable()
/**
 * This service migrates a (old) local database to the new database-per-user structure
 */
export class DatabaseMigrationService {
  constructor(
    private analyticsService: AnalyticsService,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {}

  async migrateOldDatabaseTo(newDatabase: PouchDatabase): Promise<void> {
    const oldDBName = AppConfig.settings.database.name;
    const oldDB = new PouchDatabase(new LoggingService());
    if (AppConfig.settings.session_type === SessionType.mock) {
      oldDB.initInMemoryDB(oldDBName);
    } else {
      oldDB.initIndexedDB(oldDBName);
    }
    const oldPouch = oldDB.getPouchDB();
    const info = await oldPouch.info();
    if (info.doc_count > 0) {
      await this.removeDesignDocs(oldDB);
      const newPouch = newDatabase.getPouchDB();
      await oldPouch.replicate.to(newPouch, { batch_size: 500 });
      this.analyticsService.eventTrack("migrated db to db-per-user", {
        category: "Migration",
      });
      await oldPouch.destroy();
      this.location.reload();
    } else {
      await oldPouch.destroy();
    }
  }

  private async removeDesignDocs(database: PouchDatabase): Promise<void> {
    const designDocs = await database.getAll("_design/");
    const removePromises = designDocs.map((doc) => database.remove(doc));
    await Promise.all(removePromises);
  }
}
