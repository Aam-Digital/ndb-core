import { TestBed } from '@angular/core/testing';
import { DuplicateRecordsService } from './duplicate-records.service';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service';
import { DatabaseEntity, EntityRegistry } from '../entity/database-entity.decorator';
import { EntitySchemaService } from '../entity/schema/entity-schema.service';
import { Database } from '../database/database'; 
import { SessionService } from '../session/session-service/session.service';
import { Entity } from '../entity/model/entity';
import { DatabaseField } from '../entity/database-field.decorator';

describe('DuplicateRecordsService', () => {
  let service: DuplicateRecordsService;
  let entityMapperService: EntityMapperService;
  let entityTypes: EntityRegistry;
  let entitySchemaService: EntitySchemaService;
  let database: Database; 
  let sessionService: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DuplicateRecordsService,
        EntityMapperService,
        EntityRegistry,
        EntitySchemaService,
        SessionService,
        { provide: Database, useValue: {} }, 
      ],
    });
    service = TestBed.inject(DuplicateRecordsService);
    entityMapperService = TestBed.inject(EntityMapperService);
    entityTypes = TestBed.inject(EntityRegistry);
    entitySchemaService = TestBed.inject(EntitySchemaService);
    database = TestBed.inject(Database); 
    sessionService = TestBed.inject(SessionService); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should duplicate record and save data', async () => {
    @DatabaseEntity("DuplicateTestEntity")
    class DuplicateTestEntity extends Entity {
      @DatabaseField() string: String;
      @DatabaseField() boolProperty: boolean;
    }

    const duplicateTestEntity = new DuplicateTestEntity();
    duplicateTestEntity.string = "TestName"
    duplicateTestEntity.boolProperty = true;

    const schemaName =DuplicateTestEntity.ENTITY_TYPE; 
   
    const originalData = [
      {
        record: duplicateTestEntity
      }
    ];
    
    const transformDataSpy = spyOn(service, 'transformData').and.callThrough();
    const saveAllSpy = spyOn(entityMapperService, 'saveAll');

    const data = transformDataSpy(originalData, schemaName)
 
    await service.getDataforDuplicate(originalData, schemaName);
    expect(transformDataSpy).toHaveBeenCalledWith(originalData, schemaName);
    expect(saveAllSpy).toHaveBeenCalledWith(data);
  });
});
