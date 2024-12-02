import { TestBed } from "@angular/core/testing";

import { SkillApiService } from "./skill-api.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EscoApiService } from "./esco-api.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("SkillApiService", () => {
  let service: SkillApiService;

  let mockEscoApi: jasmine.SpyObj<EscoApiService>;

  beforeEach(() => {
    mockEscoApi = jasmine.createSpyObj("EscoApiService", ["getEscoSkill"]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
        { provide: EscoApiService, useValue: mockEscoApi },
      ],
    });
    service = TestBed.inject(SkillApiService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
