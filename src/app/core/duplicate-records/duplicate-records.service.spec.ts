import { TestBed } from '@angular/core/testing';
import { DuplicateRecordsService } from './duplicate-records.service';
import { EntityMapperService } from '../entity/entity-mapper/entity-mapper.service';
import { EntityRegistry } from '../entity/database-entity.decorator';
import { EntitySchemaService } from '../entity/schema/entity-schema.service';
import { Database } from '../database/database'; 
import { SessionService } from '../session/session-service/session.service';
import { Entity } from '../entity/model/entity';

describe('DuplicateRecordsService', () => {
  let service: DuplicateRecordsService;
  let entityMapperService: EntityMapperService;
  let entityTypes: EntityRegistry;
  let entitySchemaService: EntitySchemaService;
  let database: Database; // declare the database service
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

  it('should duplicate and save data', async () => {
    const schemaName = 'your_schema_name'; // Replace with your actual schema name
    const originalData = [
      {
        record: new Entity(/* Add entity properties here */),
      },
      // Add more data as needed
    ];

    const transformDataSpy = spyOn(service, 'transformData').and.callThrough();
    const saveAllSpy = spyOn(entityMapperService, 'saveAll');

    await service.getDataforDuplicate(originalData, schemaName);

    expect(transformDataSpy).toHaveBeenCalledWith(originalData, schemaName);
    // expect(saveAllSpy).toHaveBeenCalledWith();
  });

  it('should transform data correctly', () => {
    const schemaName = 'your_schema_name'; // Replace with your actual schema name
    const originalData = [
      {
        record: new Entity(/* Add entity properties here */),
      },
      // Add more data as needed
    ];

    const transformedData = service.transformData(originalData, schemaName);

    // Add your expectations for the transformed data here
    // For example, expect transformedData to have the correct format.
  });
});
