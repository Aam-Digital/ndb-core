import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ActivityParticipantsSectionComponent } from "./activity-participants-section.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AttendanceModule } from "../attendance.module";
import { mockEntityMapper } from "app/core/entity/mock-entity-mapper-service";

describe("ActivityParticipantsSection", () => {
  let component: ActivityParticipantsSectionComponent;
  let fixture: ComponentFixture<ActivityParticipantsSectionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper([]) },
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
