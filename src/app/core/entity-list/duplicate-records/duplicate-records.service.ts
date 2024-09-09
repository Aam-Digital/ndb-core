import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";

@Injectable({
  providedIn: "root",
})
export class DuplicateRecordService {
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
    private entityService: EntitySchemaService,
  ) {}

  async duplicateRecord(sourceData: Entity[]) {
    const duplicateData = this.clone(sourceData);
    return await this.entitymapperservice.saveAll(duplicateData);
  }

  clone(sourceData: Entity[]): any {
    const duplicateData = [];

    sourceData.map((item: Entity) => {
      const entityConstructor = item.getConstructor();
      const keys = [...entityConstructor.schema.keys()].filter(
        (key) => key !== "_id" && key !== "_rev",
      );
      const dbEntity = this.entityService.transformEntityToDatabaseFormat(item);
      const entityformat = this.entityService.transformDatabaseToEntityFormat(
        dbEntity,
        entityConstructor.schema,
      );
      const entity = new entityConstructor();
      const nameAttribute = entityConstructor.toStringAttributes[0];
      for (const key of keys) {
        if (nameAttribute === key && nameAttribute !== "entityId") {
          entityformat[key] = `Copy of ${entityformat[key]}`;
        }
        entity[key] = entityformat[key];
      }
      duplicateData.push(entity);
    });
    return duplicateData;
  }
}
