import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { LinkExternalProfileDialogComponent } from "./link-external-profile-dialog.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SkillApiService } from "../../skill-api.service";
import { of } from "rxjs";
import { ExternalProfile } from "../../external-profile";

describe("LinkExternalProfileDialogComponent", () => {
  let component: LinkExternalProfileDialogComponent;
  let fixture: ComponentFixture<LinkExternalProfileDialogComponent>;
  let mockSkillApi: jasmine.SpyObj<SkillApiService>;

  beforeEach(async () => {
    mockSkillApi = jasmine.createSpyObj("SkillApiService", [
      "getExternalProfiles",
      "getExternalProfileById",
    ]);
    mockSkillApi.getExternalProfiles.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LinkExternalProfileDialogComponent],
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
    mockSkillApi.getExternalProfiles.and.returnValue(of(mockApiResults));

    component.error = { message: "previous error" };
    component.selected = { id: "previous selected" } as any;
    component.possibleMatches = [{ id: "previous result" } as any];

    component.ngOnInit();
    expect(component.loading).toBeTrue();
    tick();

    expect(component.loading).toBeFalse();
    expect(component.possibleMatches).toEqual(
      mockApiResults.map((r) => jasmine.objectContaining(r)),
    );
    expect(component.selected).toBeUndefined();
    expect(component.error).toBeUndefined();
  }));

  it("should show error but not throw if API request fails", fakeAsync(() => {
    const mockError = new Error("API error");
    mockSkillApi.getExternalProfiles.and.throwError(mockError);
    component.possibleMatches = [
      { id: "1", fullName: "previous result" } as any,
    ];

    component.searchMatches();
    tick();

    expect(component.error).toEqual(mockError);
    expect(component.loading).toBeFalse();
    expect(component.possibleMatches).toEqual([]);
  }));

  it("should show 'no results' error if API returns empty", fakeAsync(() => {
    mockSkillApi.getExternalProfiles.and.returnValue(of([]));

    component.searchMatches();
    tick();

    expect(component.error).toEqual({
      message: "No matching external profiles found",
    });
    expect(component.loading).toBeFalse();
    expect(component.possibleMatches).toEqual([]);
  }));

  it("should automatically select if API returns only a single result", fakeAsync(() => {
    const mockResult: ExternalProfile = { id: "1", fullName: "match 1" } as any;
    mockSkillApi.getExternalProfiles.and.returnValue(of([mockResult]));

    component.searchMatches();
    tick();

    expect(component.possibleMatches).toEqual([
      jasmine.objectContaining(mockResult),
    ]);
    expect(component.selected).toEqual(jasmine.objectContaining(mockResult));
  }));
});
