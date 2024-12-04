import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BulkLinkExternalProfilesComponent } from "./bulk-link-external-profiles.component";
import { SkillApiService } from "../skill-api.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";

describe("BulkLinkExternalProfilesComponent", () => {
  let component: BulkLinkExternalProfilesComponent;
  let fixture: ComponentFixture<BulkLinkExternalProfilesComponent>;

  let mockSkillApi: jasmine.SpyObj<SkillApiService>;

  beforeEach(async () => {
    mockSkillApi = jasmine.createSpyObj("SkillApiService", [
      "generateDefaultSearchParams",
      "getExternalProfiles",
      "getExternalProfileById",
    ]);
    mockSkillApi.generateDefaultSearchParams.and.returnValue({});
    mockSkillApi.getExternalProfiles.and.returnValue(
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
        BulkLinkExternalProfilesComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: SkillApiService, useValue: mockSkillApi },
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkLinkExternalProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init onChanges and search matches for all given entities", () => {
    component.ngOnChanges({ entities: true as any });

    // TODO: actual testing
  });
});
