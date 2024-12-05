import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import {
  ExternalProfileSearchParams,
  SkillApiService,
  UserProfileResponseDto,
} from "./skill-api.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EscoApiService } from "./esco-api.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { ExternalProfileLinkConfig } from "./link-external-profile/external-profile-link-config";
import { firstValueFrom } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { Skill } from "./skill";

describe("SkillApiService", () => {
  let service: SkillApiService;

  let httpTesting: HttpTestingController;
  let mockEscoApi: jasmine.SpyObj<EscoApiService>;

  beforeEach(() => {
    mockEscoApi = jasmine.createSpyObj("EscoApiService", [
      "loadOrCreateSkillEntity",
    ]);

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

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify that none of the tests make any extra HTTP requests.
    httpTesting.verify();
  });

  it("should generate searchParams based on config", () => {
    const testEntity = TestEntity.create({
      name: "John Doe",
      other: "xyz",
    });

    const result = service.generateDefaultSearchParams(testEntity, {
      searchFields: {
        fullName: ["name", "other"],
        email: ["other"],
        phone: ["other"],
      },
    } as ExternalProfileLinkConfig);
    expect(result).toEqual({
      fullName: "John Doe xyz",
      email: "xyz",
      phone: "xyz",
    });

    const resultWithSkippedParam = service.generateDefaultSearchParams(
      testEntity,
      {
        searchFields: {
          fullName: ["name", "other"],
          email: [],
        },
      } as ExternalProfileLinkConfig,
    );
    expect(resultWithSkippedParam).toEqual({
      fullName: "John Doe xyz",
      email: "", // TODO: @tomwinter - should this be undefined/skipped when sent to API?
      phone: "",
    });
  });

  it("should getExternalProfiles from API", async () => {
    const searchParams: ExternalProfileSearchParams = {
      fullName: "John Doe",
      email: "john@example.com",
    };
    const mockResults: ExternalProfile[] = [
      { id: "1", fullName: "John Doe" } as ExternalProfile,
    ];

    const result = firstValueFrom(service.getExternalProfiles(searchParams));

    httpTesting
      .expectOne(
        (req) =>
          req.url === "/api/v1/skill/user-profile" &&
          req.method === "GET" &&
          req.params.get("fullName") === searchParams.fullName &&
          req.params.get("email") === searchParams.email,
      )
      .flush({
        pagination: {},
        results: mockResults,
      } as UserProfileResponseDto);

    expect(await result).toEqual(
      jasmine.objectContaining({
        results: mockResults,
      }),
    );
  });

  it("should retry to getExternalProfiles upon error", fakeAsync(() => {
    const searchParams: ExternalProfileSearchParams = {
      fullName: "John Doe",
    };
    const mockResults: ExternalProfile[] = [
      { id: "1", fullName: "John Doe" } as ExternalProfile,
    ];

    const result = firstValueFrom(service.getExternalProfiles(searchParams));
    tick();

    httpTesting
      .expectOne("/api/v1/skill/user-profile")
      .flush(null, { status: 504, statusText: "Gateway timeout" }); // TODO: do we have auto-retries centrally somewhere? or why does this work :-D ?

    tick(5000);
    httpTesting.expectOne("/api/v1/skill/user-profile").flush({
      pagination: {},
      results: mockResults,
    } as UserProfileResponseDto);

    expectAsync(result).toBeResolvedTo(
      jasmine.objectContaining({
        results: mockResults,
      }),
    );
  }));

  it("should getExternalProfileById from API", fakeAsync(() => {
    const mockProfile: ExternalProfile = {
      id: "1",
      fullName: "John Doe",
    } as ExternalProfile;

    const result = firstValueFrom(service.getExternalProfileById("1"));

    httpTesting.expectOne("/api/v1/skill/user-profile/1").flush(mockProfile);

    expectAsync(result).toBeResolvedTo(mockProfile);
  }));

  it("should getSkillsFromExternalProfile using Esco Service", fakeAsync(() => {
    const mockProfile: ExternalProfile = {
      id: "1",
      fullName: "John Doe",
      skills: [
        { escoUri: "https://Java", usage: "ALWAYS" },
        { escoUri: "https://Angular", usage: "OFTEN" },
      ],
    } as Partial<ExternalProfile> as ExternalProfile;

    mockEscoApi.loadOrCreateSkillEntity.and.callFake(async (skill) =>
      Skill.create(skill, skill),
    );

    const result = service.getSkillsFromExternalProfile(mockProfile.id);

    httpTesting.expectOne("/api/v1/skill/user-profile/1").flush(mockProfile);
    tick();

    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledTimes(2);
    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledWith(
      "https://Java",
    );
    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledWith(
      "https://Angular",
    );

    expectAsync(result).toBeResolvedTo([
      "Skill:https://Java",
      "Skill:https://Angular",
    ]);
  }));
});
