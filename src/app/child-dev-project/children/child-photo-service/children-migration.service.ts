import { Injectable } from "@angular/core";
import { Database } from "../../../core/database/database";
import { Child } from "../model/child";

@Injectable({
  providedIn: "root",
})
export class ChildrenMigrationService {
  constructor(private database: Database) {}

  async migratePhotoFormat(): Promise<void> {
    const allChildren = await this.database.getAll(Child.ENTITY_TYPE + ":");
    allChildren.forEach((child) => {
      if (
        child.hasOwnProperty("photoFile") &&
        child["photoFile"].trim() !== ""
      ) {
        const photoFile = child["photoFile"];
        delete child.photoFile;
        child["photo"] = photoFile;
      }
    });

    await Promise.all(allChildren.map((child) => this.database.put(child)));
  }
}
