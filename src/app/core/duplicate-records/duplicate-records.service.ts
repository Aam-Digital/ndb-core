import { Injectable } from '@angular/core';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service'; 
import { EntityRegistry } from '../entity/database-entity.decorator';
import { EntitySchemaService } from '../entity/schema/entity-schema.service';
import { Entity } from '../entity/model/entity';

@Injectable({
  providedIn: 'root'
})

export class DuplicateRecordsService {
  get: jasmine.Spy<jasmine.Func>;
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
    private entityService: EntitySchemaService,
  ) {}
  async getDataforDuplicate(data: any, schemaName: string) {
   const duplicateData = this.transformData(data, schemaName)
   this.entitymapperservice.saveAll(duplicateData);
  }

  transformData(originalData: any, schemaName: string): any {
    const data = [];
    const copyData = [];
    const entityConstructor = this.entityTypes.get(schemaName);
    const keys = [...entityConstructor.schema.keys()].filter(key => key !== '_id' && key !== '_rev');
    
    originalData.map((item: { record: Entity; })=> {
      const dbEntity = this.entityService.transformEntityToDatabaseFormat(item.record);
      const entityformat = this.entityService.transformDatabaseToEntityFormat(dbEntity, entityConstructor.schema);
      data.push(entityformat);
    })
  
    data.forEach((item)=> {
      const entity = new entityConstructor();
      for (const key of keys) {
        if (key === 'name' || key === 'title' || key === 'subject') {
          item[key] = `Copy of ${item[key]}`;
        }
       entity[key] = item[key];
      }
      copyData.push(entity);
    })

    return copyData ;
  }
}
