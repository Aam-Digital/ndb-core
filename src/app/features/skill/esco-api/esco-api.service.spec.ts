import { TestBed } from "@angular/core/testing";

import {
  EscoApiService,
  EscoSkillDto,
  EscoSkillResponseDto,
} from "./esco-api.service";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { firstValueFrom } from "rxjs";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Skill } from "../skill";
import { Entity } from "../../../core/entity/model/entity";

describe("EscoApiService", () => {
  let service: EscoApiService;

  let httpTesting: HttpTestingController;
  let mockEntityMapper: any;

  const mockEscoObject: EscoSkillDto = {
    className: "Skill",
    classId: "123",
    uri: "http://data.europa.eu/esco/skill/123",
    title: "Test Skill",
    referenceLanguage: ["en"],
    preferredLabel: { en: ["Test Skill"] },
    alternativeLabel: { en: ["Test Skill"] },
    description: {
      en: {
        literal: "This is a test skill",
        mimetype: "text/plain",
      },
    },
    status: "stable",
  };

  beforeEach(() => {
    mockEntityMapper = {
      load: vi.fn(),
      save: vi.fn(),
    };
    mockEntityMapper.save.mockImplementation(async (entity) => entity);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper,
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);

    service = TestBed.inject(EscoApiService);
  });

  afterEach(() => {
    // Verify that none of the tests make any extra HTTP requests.
    httpTesting.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get ESCO skill", async () => {
    const result = firstValueFrom(service.fetchSkill(mockEscoObject.uri));

    const req = httpTesting.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "https://ec.europa.eu/esco/api/resource/skill" &&
        request.params.get("uris") === mockEscoObject.uri,
    );
    req.flush(createApiResponseDto(mockEscoObject));

    expect(await result).toEqual(mockEscoObject);
  });

  it("should retry in case of connection issues", async () => {
    vi.useFakeTimers();
    try {
      const result = firstValueFrom(service.fetchSkill(mockEscoObject.uri));

      const req = httpTesting.expectOne({});
      req.flush("Http failure", {
        status: 504,
        statusText: "Gateway Timeout",
      });
      await vi.runAllTimersAsync();

      const reqRetry = httpTesting.expectOne({});
      reqRetry.flush(createApiResponseDto(mockEscoObject));

      await expect(result).resolves.toEqual(mockEscoObject);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should load existing entity instead of making API request", async () => {
    const testSkill: Skill = Skill.create(mockEscoObject.uri, "Test Skill");
    mockEntityMapper.load.mockResolvedValue(testSkill);

    const result = service.loadOrCreateSkillEntity(testSkill.escoUri);

    await expect(result).resolves.toEqual(testSkill);
  });

  it("should create and save new entity if the Skill doesn't exist yet", async () => {
    mockEntityMapper.load.mockResolvedValue(undefined);

    const result = service.loadOrCreateSkillEntity(mockEscoObject.uri);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const req = httpTesting.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "https://ec.europa.eu/esco/api/resource/skill" &&
        request.params.get("uris") === mockEscoObject.uri,
    );
    req.flush(createApiResponseDto(mockEscoObject));

    const expectedEntity = expect.objectContaining({
      _id: Entity.createPrefixedId(Skill.ENTITY_TYPE, mockEscoObject.uri),
      escoUri: mockEscoObject.uri,
      name: mockEscoObject.title,
      description: mockEscoObject.description["en"].literal,
    } as Partial<Skill>);
    await expect(result).resolves.toEqual(expectedEntity);
    expect(mockEntityMapper.save).toHaveBeenCalledTimes(1);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(expectedEntity);
  });
});

function createApiResponseDto(result: EscoSkillDto): EscoSkillResponseDto {
  return {
    _embedded: { [result.uri]: result } as any, // TODO: what is the actual HAL format here?!?
    count: 1,
    language: "en",
  };
}
