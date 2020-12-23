import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceService } from "../attendance.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { DatePipe, PercentPipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ActivityAttendanceSectionComponent", () => {
  let component: ActivityAttendanceSectionComponent;
  let fixture: ComponentFixture<ActivityAttendanceSectionComponent>;

  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(async(() => {
    mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
      "getActivityAttendances",
    ]);

    TestBed.configureTestingModule({
      declarations: [ActivityAttendanceSectionComponent],
      imports: [EntitySubrecordModule, NoopAnimationsModule],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
        DatePipe,
        PercentPipe,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityAttendanceSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
