import { TestBed } from "@angular/core/testing";

import { DemoDataService, DemoDataServiceConfig } from "./demo-data.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../alerts/alert.service";
import { DemoDataGenerator } from "./demo-data-generator";
import { Injectable } from "@angular/core";
import { Database } from "../database/database";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { ConfigService } from "../config/config.service";
import { of } from "rxjs";
import { GenericDemoDataEngine } from "./generic/generic-demo-data-engine";
import { ValuePoolLoader } from "./generic/value-pool-loader";
import type { Mock } from "vitest";

type EntityMapperMock = Pick<EntityMapperService, "saveAll"> & {
  saveAll: Mock;
};

type DatabaseMock = Pick<Database, "isEmpty"> & {
  isEmpty: Mock;
};

@Injectable()
class MockGenerator extends DemoDataGenerator<any> {
  protected generateEntities(): any[] {
    return [{ _id: "mock:1" }];
  }
}

describe("DemoDataService", () => {
  let mockEntityMapper: EntityMapperMock;
  let mockDatabase: DatabaseMock;
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
      { provide: MockGenerator, useClass: MockGenerator },
    ];

    TestBed.configureTestingModule({
      providers: [
        DemoDataService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: AlertService,
          useValue: { addWarning: vi.fn() },
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
        {
          provide: GenericDemoDataEngine,
          useValue: { linkEntityReferences: vi.fn() },
        },
        {
          provide: ValuePoolLoader,
          useValue: { load: vi.fn().mockResolvedValue(undefined) },
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
