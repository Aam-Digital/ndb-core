import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceDetailsComponent } from "./attendance-details.component";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceModule } from "../attendance.module";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDialogRef } from "@angular/material/dialog";
import { EventNote } from "../model/event-note";
import { AttendanceService } from "../attendance.service";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { PermissionsModule } from "../../../core/permissions/permissions.module";

describe("AttendanceDetailsComponent", () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(
    waitForAsync(() => {
      const mockAttendanceService = jasmine.createSpyObj([
        "createEventForActivity",
      ]);
      mockAttendanceService.createEventForActivity.and.resolveTo(
        new EventNote()
      );

      const entity = ActivityAttendance.create(new Date(), [
        generateEventWithAttendance(
          [
            ["1", AttendanceLogicalStatus.PRESENT],
            ["2", AttendanceLogicalStatus.PRESENT],
            ["3", AttendanceLogicalStatus.ABSENT],
          ],
          new Date("2020-01-01")
        ),
        generateEventWithAttendance(
          [
            ["1", AttendanceLogicalStatus.PRESENT],
            ["2", AttendanceLogicalStatus.ABSENT],
          ],
          new Date("2020-01-02")
        ),
      ]);
      entity.activity = RecurringActivity.create("Test Activity");

      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          EntitySubrecordModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule,
          MatNativeDateModule,
          MockSessionModule.withState(),
          PermissionsModule.withAbility(),
        ],
        providers: [
          { provide: MatDialogRef, useValue: {} },
          { provide: AttendanceService, useValue: mockAttendanceService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
