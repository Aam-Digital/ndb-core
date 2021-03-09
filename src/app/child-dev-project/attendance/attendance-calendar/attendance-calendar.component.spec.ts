import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { SimpleChange } from "@angular/core";
import moment from "moment";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";

describe("AttendanceCalendarComponent", () => {
  let component: AttendanceCalendarComponent;
  let fixture: ComponentFixture<AttendanceCalendarComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [FormDialogModule],
        declarations: [AttendanceCalendarComponent],
        providers: [
          {
            provide: EntityMapperService,
            useValue: { save: () => Promise.resolve() },
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
});
