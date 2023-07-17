import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { ImportService } from "./import.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import {
  EntityRegistry,
  entityRegistry,
} from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { HealthCheck } from "../../child-dev-project/children/health-checkup/model/health-check";
import moment from "moment";

describe("ImportService", () => {
  let service: ImportService;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["save", "saveAll"]);
    TestBed.configureTestingModule({
      providers: [
        ImportService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(ImportService);
  });

  it("should execute import, saving entities and creating history record", fakeAsync(() => {
    const testEntities: Entity[] = [new Entity("1"), new Entity("2")];
    mockEntityMapper.saveAll.and.resolveTo(testEntities);
    const testImportSettings: ImportSettings = {
      entityType: "Entity",
      columnMapping: [],
      additionalActions: [],
    };

    service.executeImport(testEntities, testImportSettings);
    tick();

    expect(mockEntityMapper.saveAll).toHaveBeenCalledWith(testEntities);

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ids: testEntities.map((e) => e.getId(true)),
        config: testImportSettings,
      })
    );
  }));

  it("should transform raw data to mapped entities", async () => {
    const rawData: any[] = [
      { x: "John", y: "111" },
      { x: "Jane" },
      { x: "broken date", y: "foo" }, // date column ("y") ignored
      { x: "with broken mapping column", brokenMapping: "foo" }, // column mapped to non-existing property ignored
      { x: "", onlyUnmappedColumn: "1" }, // only empty or unmapped columns => row skipped
      { x: "with zero", y: "0" }, // "" value ignored; 0 value mapped
      { x: "custom mapping fn", z: "30.01.2023" },
    ];
    const entityType: string = "HealthCheck";
    const columnMapping: ColumnMapping[] = [
      { column: "x", propertyName: "child" },
      { column: "y", propertyName: "height" },
      { column: "z", propertyName: "date", additional: "DD.MM.YYYY" },
      { column: "brokenMapping", propertyName: "brokenMapping" },
    ];

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      entityType,
      columnMapping
    );

    let expectedEntities: any[] = [
      { child: "John", height: 111 },
      { child: "Jane" },
      { child: "broken date" },
      { child: "with broken mapping column" },
      { child: "with zero", height: 0 },
      { child: "custom mapping fn", date: moment("2023-01-30").toDate() },
    ];

    expectEntitiesToMatch(
      parsedEntities,
      expectedEntities.map((e) => Object.assign(new HealthCheck(), e)),
      true
    );
  });
});
