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
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AttendanceModule } from "../attendance.module";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDialogRef } from "@angular/material/dialog";
import { EMPTY } from "rxjs";
import { EventNote } from "../model/event-note";
import { AttendanceService } from "../attendance.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";

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

      const mockEntityMapperService = jasmine.createSpyObj(["receiveUpdates"]);
      mockEntityMapperService.receiveUpdates.and.returnValue(EMPTY);

      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          EntitySubrecordModule,
          RouterTestingModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule,
          MatNativeDateModule,
        ],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapperService },
          { provide: MatDialogRef, useValue: {} },
          { provide: AttendanceService, useValue: mockAttendanceService },
          {
            provide: SessionService,
            useValue: { getCurrentUser: () => new User() },
          },
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
