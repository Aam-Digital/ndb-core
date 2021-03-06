import { TestBed } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Database } from "../../core/database/database";
import { RecurringActivity } from "./model/recurring-activity";
import moment from "moment";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";
import { PouchDatabase } from "../../core/database/pouch-database";
import PouchDB from "pouchdb-browser";
import { LoggingService } from "../../core/logging/logging.service";
import { deleteAllIndexedDB } from "../../utils/performance-tests.spec";
import { ConfigurableEnumModule } from "../../core/configurable-enum/configurable-enum.module";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { EventNote } from "./model/event-note";

describe("AttendanceService", () => {
  let service: AttendanceService;

  let entityMapper: EntityMapperService;
  let rawPouch;

  function createEvent(date: Date, activityIdWithPrefix: string): EventNote {
    const event = EventNote.create(date, "generated event");
    event.relatesTo = activityIdWithPrefix;
    event.category = defaultInteractionTypes.find(
      (t) => t.id === "COACHING_CLASS"
    );

    return event;
  }

  let activity1, activity2: RecurringActivity;
  let e1_1, e1_2, e1_3, e2_1: EventNote;

  beforeEach(async () => {
    activity1 = RecurringActivity.create("activity 1");
    activity2 = RecurringActivity.create("activity 2");

    // testDB = MockDatabase.createWithData([]);
    rawPouch = new PouchDB("unit-testing");
    const testDB = new PouchDatabase(rawPouch, new LoggingService());

    e1_1 = createEvent(new Date("2020-01-01"), activity1._id);
    e1_2 = createEvent(new Date("2020-01-02"), activity1._id);
    e1_3 = createEvent(new Date("2020-03-02"), activity1._id);
    e2_1 = createEvent(new Date("2020-01-01"), activity2._id);

    TestBed.configureTestingModule({
      imports: [ConfigurableEnumModule],
      providers: [
        AttendanceService,
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useValue: testDB },
      ],
    });
    service = TestBed.inject(AttendanceService);
    // @ts-ignore call private method so we can await its completion, avoiding errors if afterEach is called before
    await service.createIndices();

    entityMapper = TestBed.inject<EntityMapperService>(EntityMapperService);

    await entityMapper.save(activity1);
    await entityMapper.save(activity2);

    const someUnrelatedNote = EventNote.create(
      new Date("2020-01-01"),
      "report not event"
    );
    await entityMapper.save(someUnrelatedNote);
    await entityMapper.save(e1_1);
    await entityMapper.save(e1_2);
    await entityMapper.save(e1_3);
    await entityMapper.save(e2_1);
  });

  afterEach(async () => {
    await rawPouch.close();
    await deleteAllIndexedDB(() => true);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets events for a date", async () => {
    const actualEvents = await service.getEventsOnDate(new Date("2020-01-01"));
    await expectEntitiesToMatch(actualEvents, [e1_1, e2_1]);
  });

  it("gets empty array for a date without events", async () => {
    const actualEvents = await service.getEventsOnDate(new Date("2007-01-01"));
    expect(actualEvents).toEqual([]);
  });

  it("gets events for an activity", async () => {
    const actualEvents = await service.getEventsForActivity(activity1.getId());
    await expectEntitiesToMatch(actualEvents, [e1_1, e1_2, e1_3]);
  });

  it("getActivityAttendances creates record for each month when there is at least one event", async () => {
    const actualAttendances = await service.getActivityAttendances(activity1);

    expect(actualAttendances.length).toBe(2);

    expect(
      moment(actualAttendances[0].periodFrom).isSame(
        moment("2020-01-01"),
        "day"
      )
    ).toBeTrue();
    await expectEntitiesToMatch(actualAttendances[0].events, [e1_1, e1_2]);
    expect(actualAttendances[0].activity).toEqual(activity1);

    expect(
      moment(actualAttendances[1].periodFrom).isSame(
        moment("2020-03-01"),
        "day"
      )
    ).toBeTrue();
    await expectEntitiesToMatch(actualAttendances[1].events, [e1_3]);
    expect(actualAttendances[1].activity).toEqual(activity1);
  });

  it("getAllActivityAttendancesForPeriod creates records for every activity with events in the given period", async () => {
    const actualAttendences = await service.getAllActivityAttendancesForPeriod(
      new Date("2020-01-01"),
      new Date("2020-01-05")
    );

    expect(actualAttendences.length).toBe(2);
    await expectEntitiesToMatch(
      actualAttendences.find((t) => t.activity._id === activity1._id).events,
      [e1_1, e1_2]
    );
    await expectEntitiesToMatch(
      actualAttendences.find((t) => t.activity._id === activity2._id).events,
      [e2_1]
    );

    expect(actualAttendences[0].periodFrom).toEqual(new Date("2020-01-01"));
    expect(actualAttendences[0].periodTo).toEqual(new Date("2020-01-05"));
    expect(actualAttendences[1].periodFrom).toEqual(new Date("2020-01-01"));
    expect(actualAttendences[1].periodTo).toEqual(new Date("2020-01-05"));
  });

  it("getActivitiesForChild gets all existing RecurringActivities where it is a participant", async () => {
    const testChildId = "c1";
    const testActivity1 = RecurringActivity.create("a1");
    testActivity1.participants.push(testChildId);

    await entityMapper.save(testActivity1);

    const actual = await service.getActivitiesForChild(testChildId);

    await expectEntitiesToMatch(actual, [testActivity1]); // and does not include defaults activity1 or activity2
  });
});
