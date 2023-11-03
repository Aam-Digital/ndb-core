import { Injectable } from '@angular/core';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service'; 
import { EntityRegistry } from '../entity/database-entity.decorator';
import { EntitySchemaService } from '../entity/schema/entity-schema.service';
import { Entity } from '../entity/model/entity';

@Injectable({
  providedIn: 'root'
})

export class DuplicateRecordService {
  get: jasmine.Spy<jasmine.Func>;
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
    private entityService: EntitySchemaService,
  ) {}

  async duplicateRecord(sourceData: Entity[], schemaName: string)  {
    const duplicateData = this.clone(sourceData, schemaName);
    return await this.entitymapperservice.saveAll(duplicateData);
  }

  clone(sourceData: Entity[], schemaName: string): any {
    const duplicateData = [];
    const entityConstructor = this.entityTypes.get(schemaName);
    const keys = [...entityConstructor.schema.keys()].filter(key => key !== '_id' && key !== '_rev');

    sourceData.map((item: Entity)=> {
      const dbEntity = this.entityService.transformEntityToDatabaseFormat(item);
      const entityformat = this.entityService.transformDatabaseToEntityFormat(dbEntity, entityConstructor.schema);
      const entity = new entityConstructor();
      for (const key of keys) {
        if (key === 'name' || key === 'title' || key === 'subject') {
          entityformat[key] = `Copy of ${entityformat[key]}`;
        }
       entity[key] = entityformat[key];
      }
      duplicateData.push(entity);
    })
    return duplicateData;
  }
}
