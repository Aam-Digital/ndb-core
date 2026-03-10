import { TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "./model/recurring-activity";
import moment from "moment";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { expectEntitiesToMatch } from "#src/app/utils/expect-entity-data.spec";
import { EventNote } from "./model/event-note";
import { Entity } from "#src/app/core/entity/model/entity";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { DatabaseTestingModule } from "#src/app/utils/database-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { EventWithAttendance } from "./model/event-with-attendance";

describe("AttendanceService", () => {
  let service: AttendanceService;

  let entityMapper: EntityMapperService;

  const meetingInteractionCategory = defaultInteractionTypes.find(
    (it) => it.isMeeting,
  );

  function createEvent(date: Date, activityIdWithPrefix: string): EventNote {
    const event = EventNote.create(date, "generated event");
    event.relatesTo = activityIdWithPrefix;
    event.category = defaultInteractionTypes.find(
      (t) => t.id === "COACHING_CLASS",
    );

    return event;
  }

  let activity1, activity2: RecurringActivity;
  let e1_1, e1_2, e1_3, e2_1: EventNote;

  beforeEach(waitForAsync(() => {
    activity1 = RecurringActivity.create("activity 1");
    activity2 = RecurringActivity.create("activity 2");

    e1_1 = createEvent(moment("2020-01-01").toDate(), activity1.getId());
    e1_2 = createEvent(moment("2020-01-02").toDate(), activity1.getId());
    e1_3 = createEvent(moment("2020-03-02").toDate(), activity1.getId());
    e2_1 = createEvent(moment("2020-01-01").toDate(), activity2.getId());

    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });
    service = TestBed.inject(AttendanceService);

    entityMapper = TestBed.inject<EntityMapperService>(EntityMapperService);

    entityMapper.save(activity1);
    entityMapper.save(activity2);

    entityMapper.save(e1_1);
    entityMapper.save(e1_2);
    entityMapper.save(e1_3);
    entityMapper.save(e2_1);
  }));

  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets events for a date", async () => {
    const actualEvents = await service.getEventsOnDate(
      moment("2020-01-01").toDate(),
    );
    expectEntitiesToMatch(actualEvents, [e1_1, e2_1]);
  });

  it("gets events including Notes for a date", async () => {
    const note1 = Note.create(
      moment("2020-01-01").toDate(),
      "manual event note 1",
    );
    note1.addChild("1");
    note1.addChild("2");
    note1.category = meetingInteractionCategory;
    await entityMapper.save(note1);

    const note2 = Note.create(
      moment("2020-01-02").toDate(),
      "manual event note 2",
    );
    note2.addChild("1");
    note2.category = meetingInteractionCategory;
    await entityMapper.save(note2);

    const nonMeetingNote = Note.create(
      moment("2020-01-02").toDate(),
      "manual event note 3",
    );
    nonMeetingNote.addChild("1");
    nonMeetingNote.category = defaultInteractionTypes.find((t) => !t.isMeeting);
    await entityMapper.save(nonMeetingNote);

    const actualEvents = await service.getEventsOnDate(
      moment("2020-01-01").toDate(),
      moment("2020-01-02").toDate(),
    );

    expectEntitiesToMatch(actualEvents, [e1_1, e1_2, e2_1, note1, note2]);
  });

  it("gets empty array for a date without events", async () => {
    const actualEvents = await service.getEventsOnDate(
      moment("2007-01-01").toDate(),
    );
    expect(actualEvents).toEqual([]);
  });

  it("getActivityAttendances creates record for each month when there is at least one event", async () => {
    const actualAttendances = await service.getActivityAttendances(activity1);

    expect(actualAttendances).toHaveSize(2);

    expect(
      moment(actualAttendances[0].periodFrom).isSame(
        moment("2020-01-01"),
        "day",
      ),
    ).toBeTrue();
    expectEntitiesToMatch(
      actualAttendances[0].events.map((e) => e.entity),
      [e1_1, e1_2],
    );
    expect(actualAttendances[0].activity).toEqual(activity1);

    expect(
      moment(actualAttendances[1].periodFrom).isSame(
        moment("2020-03-01"),
        "day",
      ),
    ).toBeTrue();
    expectEntitiesToMatch(
      actualAttendances[1].events.map((e) => e.entity),
      [e1_3],
    );
    expect(actualAttendances[1].activity).toEqual(activity1);
  });

  it("getActivitiesForParticipant gets all existing RecurringActivities where it is a participant", async () => {
    const testChildId = "c1";
    const testActivity1 = RecurringActivity.create("a1");
    testActivity1.participants.push(testChildId);

    await entityMapper.save(testActivity1);

    const actual = await service.getActivitiesForParticipant(testChildId);

    expectEntitiesToMatch(actual, [testActivity1]); // and does not include defaults activity1 or activity2
  });

  it("should use only direct participants for event from activity (no group expansion)", async () => {
    const activity = new RecurringActivity();
    const directChild1 = new TestEntity();
    const directChild2 = new TestEntity();
    activity.participants.push(directChild1.getId(), directChild2.getId());

    const event = await service.createEventForActivity(activity, new Date());

    expect(event.attendanceItems).toHaveSize(2);
    expect(event.attendanceItems.map((a) => a.participant)).toContain(
      directChild1.getId(),
    );
    expect(event.attendanceItems.map((a) => a.participant)).toContain(
      directChild2.getId(),
    );
  });

  it("should load the events for a date with date-picker format", async () => {
    const datePickerDate = new Date(
      moment("2021-04-05").toDate().setHours(0, 0, 0, 0),
    );
    const sameDayEvent = EventNote.create(
      moment("2021-04-05").toDate(),
      "Same Day Event",
    );
    sameDayEvent.category = meetingInteractionCategory;
    await entityMapper.save(sameDayEvent);
    const events = await service.getEventsOnDate(datePickerDate);
    expect(events).toHaveSize(1);
    expect((events[0] as EventNote).subject).toBe(sameDayEvent.subject);
  });

  describe("getAvailableEventsForRollCall", () => {
    const testDate = new Date(2024, 0, 15);
    const mockCurrentUser = new Entity("current-user");

    function findByActivity(
      events: EventWithAttendance[],
      activityId: string,
    ): EventWithAttendance | undefined {
      return events.find((e) => e.activityId === activityId);
    }

    beforeEach(async () => {
      TestBed.inject(CurrentUserSubject).next(mockCurrentUser);

      // Assign the outer activities to a different user so they don't interfere
      // with tests that rely on user-based filtering
      activity1.assignedTo = ["User:other-user"];
      activity2.assignedTo = ["User:other-user"];
      await entityMapper.save(activity1);
      await entityMapper.save(activity2);
    });

    it("returns existing events for the date", async () => {
      const existingEvent = EventNote.create(testDate);
      await entityMapper.save(existingEvent);

      const result = await service.getAvailableEventsForRollCall(testDate);

      expect(result.allEvents.map((e) => e.entity.getId())).toContain(
        existingEvent.getId(),
      );
      expect(existingEvent.isNew).toBeFalse();
    });

    it("generates an event for each activity without an existing event on the date", async () => {
      const activity = RecurringActivity.create("new activity");
      await entityMapper.save(activity);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const generatedEvent = findByActivity(result.allEvents, activity.getId());
      expect(generatedEvent).toBeTruthy();
      expect(generatedEvent.entity.isNew).toBeTrue();
    });

    it("does not generate a duplicate event when one already exists for the activity on that date", async () => {
      const activity = RecurringActivity.create("duplicate test");
      const existingEvent = EventNote.create(testDate, "existing");
      existingEvent.relatesTo = activity.getId();
      await entityMapper.save(activity);
      await entityMapper.save(existingEvent);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const eventsForActivity = result.allEvents.filter(
        (e) => e.activityId === activity.getId(),
      );
      expect(eventsForActivity).toHaveSize(1);
    });

    it("filters to activities assigned to currentUserId in events, but allEvents contains all", async () => {
      const assignedActivity = RecurringActivity.create("assigned");
      assignedActivity.assignedTo = [mockCurrentUser.getId()];
      const otherActivity = RecurringActivity.create("other");
      otherActivity.assignedTo = ["User:other-user"];
      await entityMapper.save(assignedActivity);
      await entityMapper.save(otherActivity);

      const result = await service.getAvailableEventsForRollCall(testDate);

      expect(
        findByActivity(result.events, assignedActivity.getId()),
      ).toBeTruthy();
      expect(findByActivity(result.events, otherActivity.getId())).toBeFalsy();
      expect(
        findByActivity(result.allEvents, otherActivity.getId()),
      ).toBeTruthy();
    });

    it("returns all activities when no current user is set", async () => {
      TestBed.inject(CurrentUserSubject).next(undefined);

      const activityAssignedToOther = RecurringActivity.create("other");
      activityAssignedToOther.assignedTo = [mockCurrentUser.getId()];
      await entityMapper.save(activityAssignedToOther);

      const result = await service.getAvailableEventsForRollCall(testDate);

      expect(
        findByActivity(result.events, activityAssignedToOther.getId()),
      ).toBeTruthy();
      // when no user-relevant activities exist, events and allEvents contain the same event wrappers
      expect(result.events.length).toBe(result.allEvents.length);
    });

    it("sets the currentUser as author on generated events", async () => {
      const activity = RecurringActivity.create("activity");
      await entityMapper.save(activity);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const generatedEvent = findByActivity(result.allEvents, activity.getId());
      expect(generatedEvent.entity["authors"]).toEqual([
        mockCurrentUser.getId(),
      ]);
    });

    it("sorts events: assigned to current user ranked higher, one-time events ranked highest", async () => {
      const assignedActivity = RecurringActivity.create("assigned");
      assignedActivity.assignedTo = [mockCurrentUser.getId()];
      const unassignedActivity = RecurringActivity.create("unassigned");
      const oneTimeEvent = EventNote.create(testDate, "one-time");
      // one-time events have no relatesTo
      await entityMapper.save(assignedActivity);
      await entityMapper.save(unassignedActivity);
      await entityMapper.save(oneTimeEvent);

      const result = await service.getAvailableEventsForRollCall(testDate);
      const oneTimeIdx = result.allEvents.findIndex(
        (e) => e.entity === oneTimeEvent,
      );
      const assignedIdx = result.allEvents.findIndex(
        (e) => e.activityId === assignedActivity.getId(),
      );
      const unassignedIdx = result.allEvents.findIndex(
        (e) => e.activityId === unassignedActivity.getId(),
      );

      // one-time events first (score 1 for no relatesTo alone, or score 3 if also assigned)
      expect(oneTimeIdx).toBeLessThan(unassignedIdx);
      // assigned activity ranked higher than unassigned
      expect(assignedIdx).toBeLessThan(unassignedIdx);
    });
  });
});
