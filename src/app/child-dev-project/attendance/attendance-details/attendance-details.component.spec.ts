import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceDetailsComponent } from "./attendance-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { Angulartics2Module } from "angulartics2";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceStatus } from "../model/attendance-status";
import { RecurringActivity } from "../model/recurring-activity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AttendanceModule } from "../attendance.module";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatNativeDateModule } from "@angular/material/core";

describe("AttendanceDetailsComponent", () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(async(() => {
    const entity = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance(
        {
          "1": AttendanceStatus.PRESENT,
          "2": AttendanceStatus.PRESENT,
          "3": AttendanceStatus.ABSENT,
        },
        new Date("2020-01-01")
      ),
      generateEventWithAttendance(
        {
          "1": AttendanceStatus.LATE,
          "2": AttendanceStatus.ABSENT,
        },
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
      ],
      providers: [
        { provide: EntityMapperService, useValue: {} },
        { provide: MatDialogRef, useValue: { beforeClosed: () => of({}) } },
        { provide: MAT_DIALOG_DATA, useValue: { entity: entity } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
