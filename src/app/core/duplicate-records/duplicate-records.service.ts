import { Injectable } from '@angular/core';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service'; 

@Injectable({
  providedIn: 'root'
})

export class DuplicateRecordsService {
  constructor(
    private entitymapperservice: EntityMapperService,
  
  ) {}
  async getDataforDuplicate(data: any) {
   const transformedData = this.transformData(data);
   this.entitymapperservice.saveAll(transformedData);
  }

  transformData(originalData: any): any {
    const data = []
    originalData.map((item: { record: { [x: string]: any; }; })=>{
      delete item.record["_id"]
      delete item.record["_rev"]
      delete item.record["created"]
      delete item.record["updated"]
      const modifiedItem = item.record;
      modifiedItem.name = `Copy of ${modifiedItem.name}`;
      data.push(modifiedItem)
    })
    return data ;
  }
}
