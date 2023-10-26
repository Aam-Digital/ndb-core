import { Injectable } from '@angular/core';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service'; 
import { EntityRegistry } from '../entity/database-entity.decorator';

@Injectable({
  providedIn: 'root'
})

export class DuplicateRecordsService {
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
  ) {}
  async getDataforDuplicate(data: any, schema: string) {
   const transformedData = this.transformData(data, schema)
   this.entitymapperservice.saveAll(transformedData);
  }

  transformData(originalData: any, schema: string): any {
    let data = []
    const final =[]
    const entityConstructor = this.entityTypes.get(schema);
    const keys =[...entityConstructor.schema.keys()]
    const filteredKeys = keys.filter(key => key !== '_id' && key !== '_rev');
    originalData.map((item: { record: { [x: string]: any; }; })=> {
      delete item.record["_rev"];
      delete item.record["_id"];
      const strData = JSON.stringify(item.record);
      const jsonData = JSON.parse(strData)
      
      data.push(jsonData);
    })
  
    data.forEach((i)=> {
      const entity = new entityConstructor()
      i.name = `Copy of ${i.name}`;
      for (const key of filteredKeys) {
       entity[key] = i[key]
      }
      final.push(entity)
    })
    return final ;
  }
}
