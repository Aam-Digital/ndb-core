import { Injectable } from '@angular/core';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service'; 
import { EntityRegistry } from '../entity/database-entity.decorator';
import { EntitySchemaService } from '../entity/schema/entity-schema.service';
import { Entity } from '../entity/model/entity';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root'
})

export class DuplicateRecordService {
  get: jasmine.Spy<jasmine.Func>;
  constructor(
    private entitymapperservice: EntityMapperService,
    private entityTypes: EntityRegistry,
    private entityService: EntitySchemaService,
    private snackBar: MatSnackBar,
    private config: ConfigService
  ) {}

  showFlashMessage(message: string) {
    const horizontalPosition: MatSnackBarHorizontalPosition = 'center';
    const verticalPosition: MatSnackBarVerticalPosition = 'top';
    this.snackBar.open(message, 'Close', {
      duration: 3000, 
      horizontalPosition: horizontalPosition,
      verticalPosition: verticalPosition,
    });
  }

  async duplicateRecord(sourceData: any, schemaName: string) {
    if (!sourceData || sourceData.length === 0) {
      const flashMessage = this.config.getConfig("flashMessage") as { message: string };
      this.showFlashMessage(flashMessage.message);
      return;
    }
    const duplicateData = this.transformData(sourceData, schemaName);
    return await this.entitymapperservice.saveAll(duplicateData);
  }

  transformData(sourceData: any, schemaName: string): any {
    const formattedData = [];
    const duplicatedData = [];
    const entityConstructor = this.entityTypes.get(schemaName);
    const keys = [...entityConstructor.schema.keys()].filter(key => key !== '_id' && key !== '_rev');

    sourceData.map((item: { record: Entity; })=> {
      const dbEntity = this.entityService.transformEntityToDatabaseFormat(item.record);
      const entityformat = this.entityService.transformDatabaseToEntityFormat(dbEntity, entityConstructor.schema);
      formattedData.push(entityformat);
    })

    formattedData.forEach((item)=> {
      const entity = new entityConstructor();
      for (const key of keys) {
        if (key === 'name' || key === 'title' || key === 'subject') {
          item[key] = `Copy of ${item[key]}`;
        }
       entity[key] = item[key];
      }
      duplicatedData.push(entity);
    })

    return duplicatedData;
  }
}
