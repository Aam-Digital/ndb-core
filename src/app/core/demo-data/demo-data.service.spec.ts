import { TestBed } from "@angular/core/testing";

import { DemoDataServiceConfig, DemoDataService } from "./demo-data.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { AlertService } from "../alerts/alert.service";
import {
  DemoChildConfig,
  DemoChildGenerator,
} from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";

describe("DemoDataService", () => {
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockGeneratorsProviders;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["save", "loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);
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

    expect(service.dataGenerators.length).toBe(1);
  });
});
