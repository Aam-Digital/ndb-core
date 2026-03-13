import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { LinkExternalProfileDialogComponent } from "./link-external-profile-dialog.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SkillApiService } from "../../skill-api/skill-api.service";
import { of } from "rxjs";
import { ExternalProfile } from "../../skill-api/external-profile";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpErrorResponse } from "@angular/common/http";

describe("LinkExternalProfileDialogComponent", () => {
  let component: LinkExternalProfileDialogComponent;
  let fixture: ComponentFixture<LinkExternalProfileDialogComponent>;
  let mockSkillApi: any;

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
    };
    mockSkillApi.generateDefaultSearchParams.mockReturnValue({});
    mockSkillApi.getExternalProfiles.mockReturnValue(
      of({
        pagination: {
          currentPage: 1,
          pageSize: 1,
          totalPages: 1,
          totalElements: 1,
        },
        results: [],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [
        LinkExternalProfileDialogComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entity: {},
          },
        },
        { provide: SkillApiService, useValue: mockSkillApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkExternalProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should automatically search upon init, update loading status and show results", fakeAsync(() => {
    const mockApiResults: ExternalProfile[] = [
      { id: "1", fullName: "match 1" } as Partial<ExternalProfile> as any,
      { id: "2", fullName: "match 2" } as Partial<ExternalProfile> as any,
    ];
    mockSkillApi.getExternalProfiles.mockReturnValue(
      of({
        pagination: {
          currentPage: 1,
          pageSize: 1,
          totalPages: 1,
          totalElements: 1,
        },
        results: mockApiResults,
      }),
    );
    component.error = { message: "previous error" };

    component.possibleMatches = undefined; // assume no matches have passed in (or been loaded by an earlier ngOnInit call)
    component.ngOnInit();
    expect(component.loading).toBe(true);
    tick();

    expect(component.loading).toBe(false);
    expect(component.possibleMatches).toEqual(
      mockApiResults.map((r) => expect.objectContaining(r)),
    );
    expect(component.selected).toBeUndefined();
    expect(component.error).toBeUndefined();
  }));

  it("should show error but not throw if API request fails", fakeAsync(() => {
    const mockError = new HttpErrorResponse({
      status: 500,
      statusText: "API error",
    });
    mockSkillApi.getExternalProfiles.mockImplementation(() => {
      throw mockError;
    });
    component.possibleMatches = [
      { id: "1", fullName: "previous result" } as any,
    ];

    component.searchMatches();
    tick();

    expect(component.error).toEqual(mockError);
    expect(component.loading).toBe(false);
    expect(component.possibleMatches).toBeUndefined();
  }));

  it("should show error message if API rejects for missing permissions (403)", fakeAsync(() => {
    const mockError = new HttpErrorResponse({
      status: 403,
      statusText: "No permissions error",
    });
    mockSkillApi.getExternalProfiles.mockImplementation(() => {
      throw mockError;
    });

    component.searchMatches();
    tick();

    expect(component.loading).toBe(false);
    expect(component.error.message).toEqual(
      expect.stringContaining("permission"),
    );
  }));

  it("should show 'no results' error if API returns empty", fakeAsync(() => {
    mockSkillApi.getExternalProfiles.mockReturnValue(
      of({
        pagination: {
          currentPage: 1,
          pageSize: 1,
          totalPages: 1,
          totalElements: 1,
        },
        results: [],
      }),
    );

    component.searchMatches();
    tick();

    expect(component.error).toEqual({
      message: "No matching external profiles found",
    });
    expect(component.loading).toBe(false);
    expect(component.possibleMatches).toEqual([]);
  }));

  it("should automatically select if API returns only a single result", fakeAsync(() => {
    const mockResult: ExternalProfile = { id: "1", fullName: "match 1" } as any;
    mockSkillApi.getExternalProfiles.mockReturnValue(
      of({
        pagination: {
          currentPage: 1,
          pageSize: 1,
          totalPages: 1,
          totalElements: 1,
        },
        results: [mockResult],
      }),
    );

    component.searchMatches();
    tick();

    expect(component.possibleMatches).toEqual([
      expect.objectContaining(mockResult),
    ]);
    expect(component.selected).toEqual(expect.objectContaining(mockResult));
  }));

  it("should add more results when loading next page", fakeAsync(() => {
    const mockResult1: ExternalProfile = {
      id: "1",
      fullName: "match 1",
    } as any;
    const mockResult2: ExternalProfile = {
      id: "2",
      fullName: "match 2",
    } as any;
    mockSkillApi.getExternalProfiles
      .mockReturnValueOnce(
        of({
          pagination: {
            currentPage: 1,
            pageSize: 1,
            totalPages: 2,
            totalElements: 2,
          },
          results: [mockResult1],
        }),
      )
      .mockReturnValueOnce(
        of({
          pagination: {
            currentPage: 2,
            pageSize: 1,
            totalPages: 2,
            totalElements: 2,
          },
          results: [mockResult2],
        }),
      );

    component.searchMatches();
    tick();
    expect(component.searchResult.pagination.currentPage).toBe(1);
    expect(component.searchResult.pagination.totalPages).toBe(2);

    component.loadNextPage();
    tick();
    expect(component.possibleMatches).toEqual([
      expect.objectContaining(mockResult1),
      expect.objectContaining(mockResult2),
    ]);
  }));
});
