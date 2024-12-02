import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BulkLinkExternalProfilesComponent } from "./bulk-link-external-profiles.component";
import { SkillApiService } from "../skill-api.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("BulkLinkExternalProfilesComponent", () => {
  let component: BulkLinkExternalProfilesComponent;
  let fixture: ComponentFixture<BulkLinkExternalProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BulkLinkExternalProfilesComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: SkillApiService, useValue: {} },
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
});
