import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceBlockComponent } from "./attendance-block.component";
import { AttendanceDaysComponent } from "../attendance-days/attendance-days.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule } from "@angular/forms";
import { EntityModule } from "../../../core/entity/entity.module";
import { AttendanceDayBlockComponent } from "../attendance-days/attendance-day-block.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { ActivityAttendance } from "../model/activity-attendance";

describe("AttendanceBlockComponent", () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AttendanceBlockComponent,
        AttendanceDaysComponent,
        AttendanceDayBlockComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        FormsModule,
        EntitySubrecordModule,
        EntityModule,
        RouterTestingModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceBlockComponent);
    component = fixture.componentInstance;

    component.attendanceData = ActivityAttendance.create(new Date());

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
