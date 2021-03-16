import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ActivityParticipantsSectionComponent } from "./activity-participants-section.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

describe("ActivityParticipantsSection", () => {
  let component: ActivityParticipantsSectionComponent;
  let fixture: ComponentFixture<ActivityParticipantsSectionComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityService = jasmine.createSpyObj("mockEntityService", ["save"]);

      TestBed.configureTestingModule({
        declarations: [ActivityParticipantsSectionComponent],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityParticipantsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
