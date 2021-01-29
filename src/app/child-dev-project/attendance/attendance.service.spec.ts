import { TestBed } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Database } from "../../core/database/database";
import { MockDatabase } from "../../core/database/mock-database";
import { Note } from "../notes/model/note";
import { RecurringActivity } from "./model/recurring-activity";
import moment from "moment";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";

describe("AttendanceService", () => {
  let service: AttendanceService;

  let mockDatabase: MockDatabase;

  async function addEventToDatabase(
    date: Date,
    activityIdWithPrefix: string
  ): Promise<Note> {
    const event = Note.create(date, "generated event");
    event.relatesTo = activityIdWithPrefix;
    event.category = defaultInteractionTypes.find(
      (t) => t.id === "COACHING_CLASS"
    );
    await mockDatabase.put(event);
    return event;
  }

  let activity1, activity2: RecurringActivity;
  let e1_1, e1_2, e1_3, e2_1: Note;

  beforeEach(async () => {
    activity1 = RecurringActivity.create("activity 1");
    activity2 = RecurringActivity.create("activity 2");
    const someUnrelatedNote = Note.create(
      new Date("2020-01-01"),
      "report not event"
    );
    mockDatabase = MockDatabase.createWithData([
      activity1,
      activity2,
      someUnrelatedNote,
    ]);

    e1_1 = await addEventToDatabase(new Date("2020-01-01"), activity1._id);
    e1_2 = await addEventToDatabase(new Date("2020-01-02"), activity1._id);
    e1_3 = await addEventToDatabase(new Date("2020-03-02"), activity1._id);
    e2_1 = await addEventToDatabase(new Date("2020-01-01"), activity2._id);

    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useValue: mockDatabase },
      ],
    });
    service = TestBed.inject(AttendanceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets events for a date", async () => {
    const actualEvents = await service.getEventsOnDate(new Date("2020-01-01"));
    expect(actualEvents).toEqual([e1_1, e2_1]);
  });

  it("gets empty array for a date without events", async () => {
    const actualEvents = await service.getEventsOnDate(new Date("2007-01-01"));
    expect(actualEvents).toEqual([]);
  });

  it("creates a ActivityAttendance for each month when there is at least one event", async () => {
    const actualAttendances = await service.getActivityAttendances(activity1);

    expect(actualAttendances.length).toBe(2);

    expect(
      moment(actualAttendances[0].periodFrom).isSame(
        moment("2020-01-01"),
        "day"
      )
    ).toBeTrue();
    expect(actualAttendances[0].events).toEqual([e1_1, e1_2]);
    expect(actualAttendances[0].activity).toEqual(activity1);

    expect(
      moment(actualAttendances[1].periodFrom).isSame(
        moment("2020-03-01"),
        "day"
      )
    ).toBeTrue();
    expect(actualAttendances[1].events).toEqual([e1_3]);
    expect(actualAttendances[1].activity).toEqual(activity1);
  });

  it("getActivityAttendanceForPeriod creates a single record for the given activity and period", async () => {
    const actual = await service.getActivityAttendanceForPeriod(
      activity1,
      new Date("2020-01-01"),
      new Date("2020-01-05")
    );

    expect(actual.events).toEqual([e1_1, e1_2]);
    expect(actual.activity).toEqual(activity1);
    expect(actual.periodFrom).toEqual(new Date("2020-01-01"));
    expect(actual.periodTo).toEqual(new Date("2020-01-05"));
  });

  it("getAllActivityAttendancesForPeriod creates records for every activity with events in the given period", async () => {
    const actualAttendences = await service.getAllActivityAttendancesForPeriod(
      new Date("2020-01-01"),
      new Date("2020-01-05")
    );

    expect(actualAttendences.length).toBe(2);
    expect(
      actualAttendences.find((t) => t.activity._id === activity1._id).events
    ).toEqual([e1_1, e1_2]);
    expect(
      actualAttendences.find((t) => t.activity._id === activity2._id).events
    ).toEqual([e2_1]);

    expect(actualAttendences[0].periodFrom).toEqual(new Date("2020-01-01"));
    expect(actualAttendences[0].periodTo).toEqual(new Date("2020-01-05"));
    expect(actualAttendences[1].periodFrom).toEqual(new Date("2020-01-01"));
    expect(actualAttendences[1].periodTo).toEqual(new Date("2020-01-05"));
  });

  it("getActivitiesForChild gets all existing RecurringActivities where it is a participant", async () => {
    const testChildId = "c1";
    const testActivity1 = RecurringActivity.create("a1");
    testActivity1.participants.push(testChildId);
    await mockDatabase.put(testActivity1);

    const actual = await service.getActivitiesForChild(testChildId);

    expect(actual).toEqual([testActivity1]); // and does not include defaults activity1 or activity2
  });
});
