import { TestBed } from "@angular/core/testing";

import { DemoDataServiceConfig, DemoDataService } from "./demo-data.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../alerts/alert.service";
import {
  DemoChildConfig,
  DemoChildGenerator,
} from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { Database } from "../database/database";

describe("DemoDataService", () => {
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockDatabase: jasmine.SpyObj<Database>;
  let mockGeneratorsProviders;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["saveAll"]);
    mockDatabase = jasmine.createSpyObj(["isEmpty"]);
    mockDatabase.isEmpty.and.resolveTo(true);
    mockGeneratorsProviders = [
      { provide: DemoChildGenerator, useClass: DemoChildGenerator },
      { provide: DemoChildConfig, useValue: { count: 10 } },
    ];

    TestBed.configureTestingModule({
      providers: [
        DemoDataService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: AlertService,
          useValue: jasmine.createSpyObj(["addWarning"]),
        },
        {
          provide: DemoDataServiceConfig,
          useValue: { dataGeneratorProviders: mockGeneratorsProviders },
        },
        { provide: Database, useValue: mockDatabase },
        mockGeneratorsProviders,
      ],
    });
  });

  it("should be created", () => {
    const service: DemoDataService = TestBed.inject(DemoDataService);
    expect(service).toBeTruthy();
  });

  it("should register generator but not config providers", async () => {
    const service: DemoDataService = TestBed.inject(DemoDataService);
    await service.publishDemoData();

    expect(service.dataGenerators).toHaveSize(1);
  });
});
