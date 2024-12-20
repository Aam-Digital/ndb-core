import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import {
  ExternalProfileResponseDto,
  ExternalProfileSearchParams,
  SkillApiService,
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
import { ExternalProfileLinkConfig } from "./external-profile-link-config";
import { firstValueFrom, throwError } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { FormControl, FormGroup } from "@angular/forms";
import { AlertService } from "../../core/alerts/alert.service";
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
        SkillApiService,
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
      } as ExternalProfileResponseDto);

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
    tick(1000);

    httpTesting
      .expectOne("/api/v1/skill/user-profile?fullName=John%20Doe")
      .flush(null, { status: 504, statusText: "Gateway timeout" }); // TODO: do we have auto-retries centrally somewhere? or why does this work :-D ?

    tick(5000);
    httpTesting
      .expectOne("/api/v1/skill/user-profile?fullName=John%20Doe")
      .flush({
        pagination: {},
        results: mockResults,
      } as ExternalProfileResponseDto);

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

  it("should applyDataFromExternalProfile to target entity (without reloading external profile)", fakeAsync(() => {
    const mockProfile = {
      id: "1",
      x1: "foo",
      x2: "bar",
    };
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [
        { from: "x1", to: "name" },
        { from: "x2", to: "other" },
      ],
    };
    const targetEntity = TestEntity.create({ name: "old", other: "old" });

    service.applyDataFromExternalProfile(
      mockProfile as any,
      testConfig,
      targetEntity,
    );
    tick();

    expect(targetEntity.name).toBe(mockProfile.x1);
    expect(targetEntity.other).toBe(mockProfile.x2);
  }));

  it("should applyDataFromExternalProfile after loading external profile by ID", fakeAsync(() => {
    const mockProfile = {
      id: "1",
      x1: "foo",
    };
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [{ from: "x1", to: "name" }],
    };
    const targetEntity = TestEntity.create({ name: "old" });

    service.applyDataFromExternalProfile(
      mockProfile.id,
      testConfig,
      targetEntity,
    );
    httpTesting.expectOne("/api/v1/skill/user-profile/1").flush(mockProfile);
    tick();

    expect(targetEntity.name).toBe(mockProfile.x1);
  }));

  it("should applyDataFromExternalProfile as undefined if API request for external profile fails", fakeAsync(() => {
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [{ from: "x1", to: "name" }],
    };
    const targetEntity = TestEntity.create({ name: "old" });

    const alertSpy = spyOn(TestBed.inject(AlertService), "addWarning");
    spyOn(service, "getExternalProfileById").and.returnValue(
      throwError(() => "API error"),
    );
    service.applyDataFromExternalProfile("1", testConfig, targetEntity);
    tick();

    expect(service.getExternalProfileById).toHaveBeenCalledWith("1");
    expect(alertSpy).toHaveBeenCalled();
    expect(targetEntity.name).toBeUndefined();
  }));

  it("should applyDataFromExternalProfile as undefined if external profile is undefined", fakeAsync(() => {
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [{ from: "x1", to: "name" }],
    };
    const targetEntity = TestEntity.create({ name: "old" });

    service.applyDataFromExternalProfile(undefined, testConfig, targetEntity);
    tick();

    expect(targetEntity.name).toBeUndefined();
  }));

  it("should applyDataFromExternalProfile to target formGroup", fakeAsync(() => {
    const mockProfile = {
      id: "1",
      fullName: "John Doe",
      x1: "foo",
      x2: "bar",
    };
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [
        { from: "x1", to: "name" },
        { from: "x2", to: "other" },
      ],
    };
    const targetFromGroup: FormGroup = new FormGroup({
      name: new FormControl("old"),
      other: new FormControl("old"),
    });

    service.applyDataFromExternalProfile(
      mockProfile as any,
      testConfig,
      targetFromGroup,
    );
    tick();

    expect(targetFromGroup.get("name").value).toBe(mockProfile.x1);
    expect(targetFromGroup.get("name").dirty).toBeTrue();
    expect(targetFromGroup.get("other").value).toBe(mockProfile.x2);
    expect(targetFromGroup.get("other").dirty).toBeTrue();
  }));

  it("should applyDataFromExternalProfile using transformation by Esco Service", fakeAsync(() => {
    const mockProfile: ExternalProfile = {
      id: "1",
      fullName: "John Doe",
      skills: [
        { escoUri: "https://Java", usage: "ALWAYS" },
        { escoUri: "https://Angular", usage: "OFTEN" },
      ],
    } as Partial<ExternalProfile> as ExternalProfile;
    const testConfig: ExternalProfileLinkConfig = {
      searchFields: {},
      applyData: [{ from: "skills", to: "other", transformation: "escoSkill" }],
    };
    const targetEntity = TestEntity.create({ other: "old" });

    mockEscoApi.loadOrCreateSkillEntity.and.callFake(async (skill) =>
      Skill.create(skill, skill),
    );

    service.applyDataFromExternalProfile(mockProfile, testConfig, targetEntity);
    tick();

    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledTimes(2);
    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledWith(
      "https://Java",
    );
    expect(mockEscoApi.loadOrCreateSkillEntity).toHaveBeenCalledWith(
      "https://Angular",
    );

    expect(targetEntity.other).toEqual([
      "Skill:https://Java",
      "Skill:https://Angular",
    ]);
  }));
});
