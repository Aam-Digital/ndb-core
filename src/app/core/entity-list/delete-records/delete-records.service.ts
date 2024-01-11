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
    return await this.entityRemoveService.delete(sourceData);
  }
}
