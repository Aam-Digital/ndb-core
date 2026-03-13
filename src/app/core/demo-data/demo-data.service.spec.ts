import { TestBed } from "@angular/core/testing";

import { DemoDataService, DemoDataServiceConfig } from "./demo-data.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../alerts/alert.service";
import {
  DemoChildConfig,
  DemoChildGenerator,
} from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { Database } from "../database/database";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { ConfigService } from "../config/config.service";
import { of } from "rxjs";

describe("DemoDataService", () => {
  let mockEntityMapper: any;
  let mockDatabase: any;
  let mockGeneratorsProviders;

  beforeEach(() => {
    mockEntityMapper = {
      saveAll: vi.fn(),
    };
    mockDatabase = {
      isEmpty: vi.fn(),
    };
    mockDatabase.isEmpty.mockResolvedValue(true);
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
          useValue: {
            addWarning: vi.fn(),
          },
        },
        {
          provide: DemoDataServiceConfig,
          useValue: { dataGeneratorProviders: mockGeneratorsProviders },
        },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => mockDatabase },
        },
        {
          provide: ConfigService,
          useValue: { configUpdates: of({}) },
        },
        mockGeneratorsProviders,
        EntityRegistry,
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

    expect(service.dataGenerators).toHaveLength(1);
  });
});
