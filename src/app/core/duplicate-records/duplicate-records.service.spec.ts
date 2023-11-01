import { TestBed } from '@angular/core/testing';
import { DuplicateRecordService } from './duplicate-records.service';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service';
import { DatabaseEntity, entityRegistry, EntityRegistry } from '../entity/database-entity.decorator';
import { Database } from '../database/database'; 
import { SessionService } from '../session/session-service/session.service';
import { Entity } from '../entity/model/entity';
import { DatabaseField } from '../entity/database-field.decorator';
import { CoreModule } from '../core.module';
import { ComponentRegistry } from 'app/dynamic-components';
import { UpdateMetadata } from '../entity/model/update-metadata';

describe('DuplicateRecordsService', () => {
  let service: DuplicateRecordService;
  let entityMapperService: EntityMapperService;
  let database: Database;

  @DatabaseEntity("DuplicateTestEntity")
  class DuplicateTestEntity extends Entity {
  @DatabaseField() name: String;
  @DatabaseField() boolProperty: boolean;
  @DatabaseField() created: UpdateMetadata;
  @DatabaseField() updated: UpdateMetadata;
  @DatabaseField() inactive: boolean;
  }
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        DuplicateRecordService,
        Database,
        EntityMapperService,
        SessionService,
        { provide: EntityRegistry, useValue: entityRegistry },
        ComponentRegistry,]
    });
    service = TestBed.inject(DuplicateRecordService);
    entityMapperService = TestBed.inject(EntityMapperService);
    database = TestBed.inject(Database); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should transform data correctly', () => { 
    const duplicateTest = new DuplicateTestEntity();
    duplicateTest.name = "TestName"
    duplicateTest.boolProperty = true;
    
    const schemaName = DuplicateTestEntity.ENTITY_TYPE;
    const originalData = [
      {
        record: duplicateTest
      }
    ];

    const transformedData = service.transformData(originalData, schemaName);
    expect(transformedData[0]).toBeInstanceOf(Entity);
    expect(transformedData[0]._id).toBeDefined(); 
    expect(transformedData[0]._id).not.toBe(duplicateTest['_id']); 
    expect(transformedData[0].name).toMatch(/^Copy of /);
    expect(transformedData[0].boolProperty).toBe(true); 
  });

  it('should duplicate record and save data', async () => {
    @DatabaseEntity("SaveTestEntity")
    class SaveTestEntity extends Entity {
    @DatabaseField() name: String;
    @DatabaseField() boolProperty: boolean;
    @DatabaseField() created: UpdateMetadata;
    @DatabaseField() updated: UpdateMetadata;
    @DatabaseField() inactive: boolean;
    }
  
    const duplicateTestEntity = new SaveTestEntity();
    duplicateTestEntity.name = "TestName"
    duplicateTestEntity.boolProperty = true;
    duplicateTestEntity.inactive = false;

    const schemaName =DuplicateTestEntity.ENTITY_TYPE; 
    
    const originalData = [
      {
        record: duplicateTestEntity
      }
    ];
  
    const transformDataSpy = spyOn(service, 'transformData').and.callThrough();
    const saveAllSpy = spyOn(entityMapperService, 'saveAll');
    await service.duplicateRecord(originalData, schemaName);
    expect(transformDataSpy).toHaveBeenCalledWith(originalData, schemaName);
    expect(saveAllSpy).toHaveBeenCalled();

  });
});
