import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { BulkLinkExternalProfilesComponent } from "./bulk-link-external-profiles.component";
import {
  ExternalProfileResponseDto,
  SkillApiService,
} from "../skill-api/skill-api.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of, throwError } from "rxjs";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";

describe("BulkLinkExternalProfilesComponent", () => {
  let component: BulkLinkExternalProfilesComponent;
  let fixture: ComponentFixture<BulkLinkExternalProfilesComponent>;

  let mockSkillApi: any;
  let mockEntityMapper: any;

  beforeEach(async () => {
    mockSkillApi = {
      generateDefaultSearchParams: vi
        .fn()
        .mockName("SkillApiService.generateDefaultSearchParams"),
      getExternalProfiles: vi
        .fn()
        .mockName("SkillApiService.getExternalProfiles"),
      getExternalProfileById: vi
        .fn()
        .mockName("SkillApiService.getExternalProfileById"),
      applyDataFromExternalProfile: vi
        .fn()
        .mockName("SkillApiService.applyDataFromExternalProfile"),
    };
    mockSkillApi.generateDefaultSearchParams.mockReturnValue({});
    mockSkillApi.getExternalProfiles.mockReturnValue(
      of(createPaginatedResult([])),
    );
    mockSkillApi.getExternalProfileById.mockImplementation((id) =>
      of({ id } as any),
    );

    mockEntityMapper = {
      saveAll: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        BulkLinkExternalProfilesComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: SkillApiService, useValue: mockSkillApi },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkLinkExternalProfilesComponent);
    component = fixture.componentInstance;

    // default inputs
    component.entities = [
      TestEntity.create({ name: "Test 1", other: "Other", ref: "r1" }),
      TestEntity.create({ name: "Test 2", other: "Other", ref: "r2" }),
    ];
    component.config = {
      id: "externalProfile",
      additional: {
        searchFields: { fullName: ["name", "other"], email: ["ref"] },
      } as ExternalProfileLinkConfig,
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init onChanges and search matches for all given entities", fakeAsync(() => {
    const expected1 = {
      entity: component.entities[0],
      possibleMatches: [],
      possibleMatchesCount: 0,
    };
    const expected2 = {
      entity: component.entities[1],
      possibleMatches: [{ id: "1" }, { id: "2" }],
      possibleMatchesCount: 2,
    };
    mockSkillApi.getExternalProfiles
      .mockReturnValueOnce(of(createPaginatedResult(expected1.possibleMatches)))
      .mockReturnValueOnce(
        of(createPaginatedResult(expected2.possibleMatches)),
      );

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(mockSkillApi.getExternalProfiles).toHaveBeenCalledTimes(2);
    expect(component.records.data).toEqual([
      expect.objectContaining(expected1),
      expect.objectContaining(expected2),
    ]);
    expect(component.matchedRecordsCount).toBe(0);
  }));

  it("should gracefully skip and continue if request for one record fails", fakeAsync(() => {
    const expected2 = {
      entity: component.entities[1],
      possibleMatches: [{ id: "1" }, { id: "2" }],
      possibleMatchesCount: 2,
    };
    mockSkillApi.getExternalProfiles
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      )
      .mockReturnValueOnce(
        of(createPaginatedResult(expected2.possibleMatches)),
      );

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(mockSkillApi.getExternalProfiles).toHaveBeenCalledTimes(2);
    expect(component.records.data).toEqual([
      {
        entity: component.entities[0],
        possibleMatches: [],
        possibleMatchesCount: 0,
        warning: { possibleMatches: expect.any(String) },
      },
      expect.objectContaining(expected2),
    ]);
  }));

  it("should pre-select the possible match if exactly one result", fakeAsync(() => {
    mockSkillApi.getExternalProfiles
      .mockReturnValueOnce(of(createPaginatedResult([{ id: "1" }])))
      .mockReturnValueOnce(of(createPaginatedResult([{ id: "2" }])));

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(mockSkillApi.getExternalProfiles).toHaveBeenCalledTimes(2);
    expect(component.records.data).toEqual([
      expect.objectContaining({ selected: { id: "1" } }),
      expect.objectContaining({ selected: { id: "2" } }),
    ]);
    expect(component.matchedRecordsCount).toBe(2);
  }));

  it("should pre-select existing link from record", fakeAsync(() => {
    const entity1 = TestEntity.create({ name: "Test 1" });
    entity1[component.config.id] = "original-1";
    const entity2 = TestEntity.create({ name: "Test 2" });
    entity2[component.config.id] = "original-2";
    component.entities = [entity1, entity2];

    mockSkillApi.getExternalProfiles
      .mockReturnValueOnce(of(createPaginatedResult([])))
      .mockReturnValueOnce(of(createPaginatedResult([{ id: "new-2" }])));

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(component.records.data).toEqual([
      expect.objectContaining({ selected: { id: "original-1" } }),
      expect.objectContaining({
        selected: { id: "original-2" },
        possibleMatches: [{ id: "new-2" }],
      }),
    ]);
    expect(component.matchedRecordsCount).toBe(2);
  }));

  it("should infer config from given entities based on field type", () => {
    const externalProfileFieldSchema = {
      dataType: "string",
      editComponent: "EditExternalProfileLink",
      additional: {
        searchFields: { fullName: ["name"] },
      } as ExternalProfileLinkConfig,
    };
    const mockEntity = TestEntity.create({ name: "Test 1" });
    mockEntity.getSchema().set("externalProfile", externalProfileFieldSchema);
    component.config = undefined;
    component.entities = [TestEntity.create("Test 1")];

    component.ngOnChanges({ entities: true as any });

    expect(component.config).toEqual({
      id: "externalProfile",
      ...externalProfileFieldSchema,
    });

    // cleanup
    mockEntity.getSchema().delete("externalProfile");
  });

  it("should skip if no config is available", fakeAsync(() => {
    component.config = undefined;

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(mockSkillApi.getExternalProfiles).not.toHaveBeenCalled();
    expect(component.records).toBeUndefined();
  }));

  it("should show warning if existing link from record cannot be loaded", fakeAsync(() => {
    const entity = TestEntity.create({
      name: "Test 1",
      externalProfile: "r1",
    } as any);
    component.entities = [entity, TestEntity.create("Test 2")];

    mockSkillApi.getExternalProfileById.mockReturnValue(
      throwError(() => "API error"),
    );

    component.ngOnChanges({ entities: true as any });
    tick();

    expect(component.records.data[0].warning.selected).toEqual(
      expect.any(String),
    );
    expect(component.records.data[1].warning).toBeUndefined();
  }));

  it("should select match when user edits via dialog", fakeAsync(() => {
    component.ngOnChanges({ entities: true as any });
    tick();
    const testRecord = component.records.data[0];
    vi.spyOn(TestBed.inject(MatDialog), "open").mockReturnValue({
      afterClosed: () => of({ id: "new-ext-profile" }),
    } as any);

    component.editMatch(testRecord);
    tick();

    expect(testRecord.selected).toEqual(
      expect.objectContaining({ id: "new-ext-profile" }),
    );
    expect(component.matchedRecordsCount).toBe(1);
  }));

  it("should unselect match when user clicks 'x'", fakeAsync(() => {
    component.ngOnChanges({ entities: true as any });
    tick();
    const testRecord = component.records.data[0];
    testRecord.selected = { id: "ext-profile" } as any;
    component.matchedRecordsCount = 1;

    component.unlinkMatch(testRecord);

    expect(testRecord.selected).toBeUndefined();
    expect(component.matchedRecordsCount).toBe(0);
  }));

  it("should save all changed entities upon confirmation and also apply skills data", fakeAsync(() => {
    const entity1 = TestEntity.create({ name: "link to be added" });
    const entity2 = TestEntity.create({
      name: "link to be removed",
      externalProfile: "1",
      skills: ["old-skill"],
    } as any);
    const entity3 = TestEntity.create({
      name: "link to be changed",
      externalProfile: "old",
      skills: ["old-skill"],
    } as any);
    const entity4 = TestEntity.create({
      name: "unchanged",
      externalProfile: "2",
      skills: ["old-skill"],
    } as any);
    component.entities = [entity1, entity2, entity3, entity4];
    component.ngOnChanges({ entities: true as any });
    tick();
    mockSkillApi.applyDataFromExternalProfile.mockImplementation(
      async (x, config, target) => {
        target["skills"] = !!x ? ["skill-1"] : undefined;
      },
    );

    component.records.data.find((r) => r.entity === entity1).selected = {
      id: "new-1",
    } as any;
    component.records.data.find((r) => r.entity === entity2).selected =
      undefined;
    component.records.data.find((r) => r.entity === entity3).selected = {
      id: "new-2",
    } as any;
    component.save();
    tick();

    expect(mockEntityMapper.saveAll).toHaveBeenCalled();
    const savedEntities = vi.mocked(mockEntityMapper.saveAll).mock.lastCall[0];
    expect(savedEntities.length).toBe(3);
    expect(savedEntities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "link to be added",
          externalProfile: "new-1",
          skills: ["skill-1"],
        }),
        expect.objectContaining({
          name: "link to be removed",
          externalProfile: undefined,
          skills: ["old-skill"],
        }),
        expect.objectContaining({
          name: "link to be changed",
          externalProfile: "new-2",
          skills: ["skill-1"],
        }),
      ]),
    );

    // TODO: should the unchanged entity also receive an update of its skills data or leave unchanged?
  }));

  it("should skip record if API throws error and continue with other records without aborting", fakeAsync(() => {
    mockSkillApi.applyDataFromExternalProfile.mockImplementation(
      async (extProfile, c, target) => {
        if (extProfile === "broken" || extProfile?.["id"] === "broken") {
          throw "API error";
        } else {
          target["skills"] = ["skill-1"];
        }
      },
    );

    component.ngOnChanges({ entities: true as any });
    tick();
    component.records.data[0].selected = { id: "broken" } as any;
    component.records.data[0].entity["skills"] = ["old-skill"];
    component.records.data[1].selected = { id: "good-link" } as any;

    component.save();
    tick();

    expect(mockEntityMapper.saveAll).toHaveBeenCalled();
    const savedEntities = vi.mocked(mockEntityMapper.saveAll).mock.lastCall[0];
    expect(savedEntities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalProfile: "good-link",
          skills: ["skill-1"],
        }),
        expect.objectContaining({
          externalProfile: "broken",
          skills: ["old-skill"], // TODO: should previous skills value be removed in case the API request fails?
        }),
      ]),
    );
  }));
});

function createPaginatedResult(results: any[]): ExternalProfileResponseDto {
  return {
    pagination: {
      currentPage: 1,
      pageSize: 2,
      totalPages: results.length % 2,
      totalElements: results.length,
    },
    results: results,
  };
}
