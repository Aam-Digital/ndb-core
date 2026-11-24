import { TestBed } from "@angular/core/testing";

import { DemoDataService, DemoDataServiceConfig } from "./demo-data.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../alerts/alert.service";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "./demo-data-generator";
import { Entity } from "../entity/model/entity";
import { Database } from "../database/database";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { ConfigService } from "../config/config.service";
import { of } from "rxjs";
import type { Mock } from "vitest";
import { GenericDemoDataEngine } from "./generic/generic-demo-data-engine";
import { DemoEntityStore } from "./generic/demo-entity-store";

/** a generator registered through the config, to check it is picked up */
@Injectable()
class StubDemoDataGenerator extends DemoDataGenerator<Entity> {
  protected generateEntities(): Entity[] {
    return [];
  }
}

type EntityMapperMock = Pick<EntityMapperService, "saveAll"> & {
  saveAll: Mock;
};

type DatabaseMock = Pick<Database, "isEmpty"> & {
  isEmpty: Mock;
};

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
      { provide: StubDemoDataGenerator, useClass: StubDemoDataGenerator },
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
        {
          provide: GenericDemoDataEngine,
          useValue: { init: () => Promise.resolve(), linkReferences: () => {} },
        },
        mockGeneratorsProviders,
        EntityRegistry,
        DemoEntityStore,
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
