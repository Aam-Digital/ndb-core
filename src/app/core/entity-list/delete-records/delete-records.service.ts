import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";
import { EntityActionsService } from "app/core/entity/entity-actions/entity-actions.service";

@Injectable({
  providedIn: "root",
})
export class DeleteRecordService {
  get: jasmine.Spy<jasmine.Func>;
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
    private entityService: EntitySchemaService,
    private entityRemoveService: EntityActionsService,
  ) {}

  async deleteRecord(sourceData: Entity[]) {
    const deleteData = this.delete(sourceData);
    return await this.entitymapperservice.saveAll(deleteData);
  }

  delete(sourceData: Entity[]): any {
    this.entityRemoveService.delete(sourceData[0]);
    return;

    // const deleteData = [];

    // sourceData.map((item: Entity) => {
    //   const entityConstructor = item.getConstructor();
    //   const keys = [...entityConstructor.schema.keys()].filter(
    //     (key) => key !== "_id" && key !== "_rev",
    //   );
    //   const dbEntity = this.entityService.transformEntityToDatabaseFormat(item);
    //   const entityformat = this.entityService.transformDatabaseToEntityFormat(
    //     dbEntity,
    //     entityConstructor.schema,
    //   );
    //   const entity = new entityConstructor();
    //   const nameAttribute = entityConstructor.toStringAttributes[0];
    //   for (const key of keys) {
    //     if (nameAttribute === key && nameAttribute !== "entityId") {
    //       entityformat[key] = `Copy of ${entityformat[key]}`;
    //     }
    //     entity[key] = entityformat[key];
    //   }
    //   deleteData.push(entity);
    // });
    // return deleteData;
  }
}
