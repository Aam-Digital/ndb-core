import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import moment from "moment";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { AttendanceItem } from "../../model/attendance-item";
import { NullAttendanceStatusType } from "../../model/attendance-status";
import { AttendanceService } from "../../attendance.service";
import { AnalyticsService } from "#src/app/core/analytics/analytics.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { MatNativeDateModule } from "@angular/material/core";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { createEntityMapperSpyObj } from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { Angulartics2Module } from "angulartics2";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { faCaretDown, faTimes } from "@fortawesome/free-solid-svg-icons";

describe("AttendanceCalendarComponent", () => {
  let component: AttendanceCalendarComponent;
  let fixture: ComponentFixture<AttendanceCalendarComponent>;

  beforeEach(() => {
    const mockAttendanceService = {
      createEventForActivity: vi.fn(),
    };
    mockAttendanceService.createEventForActivity.mockResolvedValue(
      new EventWithAttendance(
        new TestEventEntity(),
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    );

    TestBed.configureTestingModule({
      imports: [
        AttendanceCalendarComponent,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
      ],
      providers: [
        { provide: EntityMapperService, useValue: createEntityMapperSpyObj() },
        {
          provide: AnalyticsService,
          useValue: {
            eventTrack: vi.fn(),
          },
        },
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
        {
          provide: EntityAbility,
          useValue: {
            can: vi.fn(),
            cannot: vi.fn(),
          },
        },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceCalendarComponent);
    component = fixture.componentInstance;
    TestBed.inject(FaIconLibrary).addIcons(faCaretDown, faTimes);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets min and max selectable date based on time range of given records", () => {
    fixture.componentRef.setInput("records", [
      TestEventEntity.generateEventWithAttendance([], new Date("2020-01-05")),
      TestEventEntity.generateEventWithAttendance([], new Date("2020-01-20")),
    ]);

    expect(
      moment(component.minDate()).isSame(moment("2020-01-01"), "day"),
    ).toBe(true);
    expect(
      moment(component.maxDate()).isSame(moment("2020-01-31"), "day"),
    ).toBe(true);
  });

  it("should correctly compute the average attendance", () => {
    const attendedChild = new TestEntity("attendedChild");
    const absentChild = new TestEntity("absentChild");
    const childWithoutAttendance = new TestEntity("childWithoutAttendance");
    const presentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "PRESENT",
    );
    const absentAttendance = defaultAttendanceStatusTypes.find(
      (it) => it.id === "ABSENT",
    );
    const event = Object.assign(new TestEventEntity(), {
      date: new Date(),
      attendance: [
        new AttendanceItem(presentAttendance, "", attendedChild.getId()),
        new AttendanceItem(absentAttendance, "", absentChild.getId()),
        new AttendanceItem(
          NullAttendanceStatusType,
          "",
          childWithoutAttendance.getId(),
        ),
      ],
    });
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);

    component.selectDay(new Date());

    expect(component.selectedEventStats()).not.toBeNull();
    expect(component.selectedEventStats()!.average).toEqual(0.5);
    expect(component.selectedEventStats()!.excludedUnknown).toBe(1);
  });

  it("should mark day with red triangle when highlighted child has no attendance status for event", () => {
    const testDate = new Date("2020-06-15");
    const childWithNoStatus = new TestEntity("child_no_status");
    const event = TestEventEntity.create(testDate);
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);
    fixture.componentRef.setInput(
      "highlightForChild",
      childWithNoStatus.getId(),
    );

    const classes = component.highlightDate(testDate);

    expect(
      classes["attendance-calendar-date-has-participants-with-unknown-status"],
    ).toBe(true);
  });

  it("should apply status style class when highlighted child has a known attendance status", () => {
    const testDate = new Date("2020-06-15");
    const child = new TestEntity("child_present");
    const presentStatus = defaultAttendanceStatusTypes.find(
      (it) => it.id === "PRESENT",
    );
    const event = Object.assign(TestEventEntity.create(testDate), {
      attendance: [new AttendanceItem(presentStatus, "", child.getId())],
    });
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);
    fixture.componentRef.setInput("highlightForChild", child.getId());

    const classes = component.highlightDate(testDate);

    expect(classes["attendance-status-" + presentStatus.id]).toBe(true);
    expect(
      classes["attendance-calendar-date-has-participants-with-unknown-status"],
    ).toBeFalsy();
  });

  it("should mark day with no-data class when no participant has any status (NaN% attendance)", () => {
    const testDate = new Date("2020-06-15");
    const event = Object.assign(TestEventEntity.create(testDate), {
      attendance: [
        new AttendanceItem(NullAttendanceStatusType, "", "child1"),
        new AttendanceItem(NullAttendanceStatusType, "", "child2"),
      ],
    });
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);

    const classes = component.highlightDate(testDate);

    expect(classes["attendance-calendar-date-no-data"]).toBe(true);
  });

  it("should apply w-XX class (not no-data) when at least one participant has a known status", () => {
    const testDate = new Date("2020-06-15");
    const presentStatus = defaultAttendanceStatusTypes.find(
      (it) => it.id === "PRESENT",
    );
    const event = Object.assign(TestEventEntity.create(testDate), {
      attendance: [
        new AttendanceItem(presentStatus, "", "child1"),
        new AttendanceItem(NullAttendanceStatusType, "", "child2"),
      ],
    });
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);

    const classes = component.highlightDate(testDate);

    expect(classes["attendance-calendar-date-no-data"]).toBeFalsy();
    expect(classes["w-100"]).toBe(true);
  });

  it("should add focused participant on the fly if not part of event already", () => {
    const testDate = new Date();
    const excludedChild = new TestEntity("excluded_child");
    const event = TestEventEntity.create(testDate);
    fixture.componentRef.setInput("records", [
      new EventWithAttendance(
        event,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      ),
    ]);
    fixture.componentRef.setInput("highlightForChild", excludedChild.getId());

    component.selectDay(testDate);
    fixture.detectChanges();

    expect(
      component
        .selectedEvent()!
        .getAttendanceForParticipant(excludedChild.getId()),
    ).toBeDefined();
  });
});
