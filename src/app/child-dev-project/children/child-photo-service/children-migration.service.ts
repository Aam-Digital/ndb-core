import { Injectable } from "@angular/core";
import { Database } from "../../../core/database/database";
import { Child } from "../model/child";
import { LoggingService } from "../../../core/logging/logging.service";

@Injectable({
  providedIn: "root",
})
export class ChildrenMigrationService {
  constructor(private database: Database, private logging: LoggingService) {}

  async migratePhotoFormat(): Promise<void> {
    const oldFormatChildren = (
      await this.database.getAll(Child.ENTITY_TYPE + ":")
    ).filter(
      (child) =>
        child.hasOwnProperty("photoFile") && child["photoFile"].trim() !== ""
    );
    oldFormatChildren.forEach((child) => {
      const photoFile = child["photoFile"];
      delete child.photoFile;
      child["photo"] = photoFile;
    });

    await Promise.all(
      oldFormatChildren.map((child) => this.database.put(child))
    );
    this.logging.info(`migrated ${oldFormatChildren.length} objects`);
  }
}
