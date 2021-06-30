import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EducationalMaterial } from "../../child-dev-project/educational-material/model/educational-material";
import { Aser } from "../../child-dev-project/aser/model/aser";
import { Entity } from "../entity/model/entity";
import { Child } from "../../child-dev-project/children/model/child";
import { Note } from "../../child-dev-project/notes/model/note";

@Injectable({
  providedIn: "root",
})
export class ConfigurableEnumMigrationService {
  constructor(private entityMapper: EntityMapperService) {}

  async migrateSelectionsToConfigurableEnum(): Promise<void> {
    const entitiesToMigrate: typeof Entity[] = [
      Aser,
      EducationalMaterial,
      Child,
      Note,
    ];
    for (const entityConstructor of entitiesToMigrate) {
      const entities = await this.entityMapper.loadType(entityConstructor);
      // The entities will automatically be saved correctly once the schema is applied
      await Promise.all(
        entities.map((entity) => this.entityMapper.save(entity))
      );
    }
  }
}
