import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ActivityParticipantsSectionComponent } from "./activity-participants-section.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AttendanceModule } from "../attendance.module";
import { mockEntityMapper } from "app/core/entity/mock-entity-mapper-service";
import { AppButtonsModule } from "../../../core/app-buttons/app-buttons.module";
import { EntityPermissionsService } from "../../../core/permissions/entity-permissions.service";

describe("ActivityParticipantsSection", () => {
  let component: ActivityParticipantsSectionComponent;
  let fixture: ComponentFixture<ActivityParticipantsSectionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule, AppButtonsModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper([]) },
          { provide: EntityPermissionsService, useValue: {} },
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
