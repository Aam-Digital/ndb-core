import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { SimpleChange } from "@angular/core";
import moment from "moment";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { Note } from "../../notes/model/note";
import { Child } from "../../children/model/child";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

describe("AttendanceCalendarComponent", () => {
  let component: AttendanceCalendarComponent;
  let fixture: ComponentFixture<AttendanceCalendarComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [FormDialogModule, MatDatepickerModule, MatNativeDateModule],
        declarations: [AttendanceCalendarComponent],
        providers: [
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper(),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets min and max selectable date based on time range of given records", () => {
    component.records = [
      generateEventWithAttendance([], new Date("2020-01-05")),
      generateEventWithAttendance([], new Date("2020-01-20")),
    ];

    component.ngOnChanges({
      records: new SimpleChange(undefined, component.records, true),
    });

    expect(
      moment(component.minDate).isSame(moment("2020-01-01"), "day")
    ).toBeTrue();
    expect(
      moment(component.maxDate).isSame(moment("2020-01-31"), "day")
    ).toBeTrue();
  });

  it("should correctly compute the average attendance", () => {
    const attendedChild = new Child("attendedChild");
    const absentChild = new Child("absentChild");
    const childWithoutAttendance = new Child("childWithoutAttendance");
    const note = new Note();
    note.date = new Date();
    note.addChild(attendedChild.getId());
    note.addChild(absentChild.getId());
    note.addChild(childWithoutAttendance.getId());
    const presentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "PRESENT"
    );
    const absentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "ABSENT"
    );
    note.getAttendance(attendedChild.getId()).status = presentAttendance;
    note.getAttendance(absentChild.getId()).status = absentAttendance;
    component.records = [note];

    component.selectDay(new Date());

    expect(component.selectedEventStats).not.toBeNull();
    expect(component.selectedEventStats.average).toEqual(0.5);
    expect(component.selectedEventStats.excludedUnknown).toBe(1);
  });
});
