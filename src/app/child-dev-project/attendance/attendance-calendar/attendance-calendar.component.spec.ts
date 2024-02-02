import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { SimpleChange } from "@angular/core";
import moment from "moment";
import { Note } from "../../notes/model/note";
import { Child } from "../../children/model/child";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EventNote } from "../model/event-note";
import { AttendanceService } from "../attendance.service";
import { AnalyticsService } from "../../../core/analytics/analytics.service";
import { EntityAbility } from "../../../core/permissions/ability/entity-ability";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { MatNativeDateModule } from "@angular/material/core";

describe("AttendanceCalendarComponent", () => {
  let component: AttendanceCalendarComponent;
  let fixture: ComponentFixture<AttendanceCalendarComponent>;

  beforeEach(waitForAsync(() => {
    const mockAttendanceService = jasmine.createSpyObj([
      "createEventForActivity",
    ]);
    mockAttendanceService.createEventForActivity.and.resolveTo(new EventNote());
    TestBed.configureTestingModule({
      imports: [AttendanceCalendarComponent, MatNativeDateModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj(["eventTrack"]),
        },
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
        {
          provide: EntityAbility,
          useValue: jasmine.createSpyObj(["cannot"]),
        },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();
  }));

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
      moment(component.minDate).isSame(moment("2020-01-01"), "day"),
    ).toBeTrue();
    expect(
      moment(component.maxDate).isSame(moment("2020-01-31"), "day"),
    ).toBeTrue();
  });

  it("should correctly compute the average attendance", () => {
    const attendedChild = new Child("attendedChild");
    const absentChild = new Child("absentChild");
    const childWithoutAttendance = new Child("childWithoutAttendance");
    const note = new Note();
    note.date = new Date();
    note.addChild(attendedChild);
    note.addChild(absentChild);
    note.addChild(childWithoutAttendance);
    const presentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "PRESENT",
    );
    const absentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "ABSENT",
    );
    note.getAttendance(attendedChild).status = presentAttendance;
    note.getAttendance(absentChild).status = absentAttendance;
    component.records = [note];

    component.selectDay(new Date());

    expect(component.selectedEventStats).not.toBeNull();
    expect(component.selectedEventStats.average).toEqual(0.5);
    expect(component.selectedEventStats.excludedUnknown).toBe(1);
  });

  it("should add focused participant on the fly if not part of event already", () => {
    const testDate = new Date();
    const excludedChild = new Child("excluded_child");
    const note = new Note();
    note.date = testDate;
    component.records = [note];
    component.highlightForChild = excludedChild.getId();

    component.selectDay(testDate);

    expect(component.selectedEvent.children).toContain(excludedChild.getId());
  });
});
