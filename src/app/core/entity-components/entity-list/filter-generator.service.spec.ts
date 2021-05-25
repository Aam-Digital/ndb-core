import { TestBed } from "@angular/core/testing";

import { FilterGeneratorService } from "./filter-generator.service";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { LoggingService } from "../../logging/logging.service";

describe("FilterGeneratorService", () => {
  let service: FilterGeneratorService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityMapperService, useValue: EntityMapperService },
        LoggingService,
      ],
    });
    service = TestBed.inject(FilterGeneratorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
