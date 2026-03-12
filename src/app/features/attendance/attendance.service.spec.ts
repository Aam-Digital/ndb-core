import { TestBed } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import moment from "moment";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { EventWithAttendance } from "./model/event-with-attendance";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { ConfigService } from "#src/app/core/config/config.service";
import {
  DatabaseEntity,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { GroupParticipantResolverService } from "./deprecated/group-participant-resolver";
import { BehaviorSubject } from "rxjs";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";

@DatabaseEntity("RecurringActivity")
class MockRecurringActivity extends Entity {
  static override ENTITY_TYPE = "RecurringActivity";

  static create(title: string = ""): MockRecurringActivity {
    const instance = new MockRecurringActivity();
    instance.title = title;
    return instance;
  }

  @DatabaseField() title: string = "";

  @DatabaseField() type: any;

  @DatabaseField({ dataType: "entity", additional: "TestEntity" })
  participants: string[] = [];

  @DatabaseField() linkedGroups: string[] = [];

  @DatabaseField({ dataType: "entity", additional: "TestEntity" })
  excludedParticipants: string[] = [];

  @DatabaseField({ dataType: "entity", additional: "TestEntity" })
  assignedTo: string[] = [];
}

describe("AttendanceService", () => {
  let service: AttendanceService;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockDbIndexing: jasmine.SpyObj<DatabaseIndexingService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let currentUserSubject: BehaviorSubject<Entity | undefined>;
  let mockEntityRegistry: jasmine.SpyObj<EntityRegistry>;

  const meetingInteractionCategory = defaultInteractionTypes.find(
    (it) => it.isMeeting,
  );

  function createEvent(date: Date, activityIdWithPrefix: string): Note {
    const event = Note.create(date, "generated event");
    event.relatesTo = activityIdWithPrefix;
    event.category = defaultInteractionTypes.find(
      (t) => t.id === "COACHING_CLASS",
    );
    return event;
  }

  let activity1: MockRecurringActivity;
  let activity2: MockRecurringActivity;
  let e1_1: Note;
  let e1_2: Note;
  let e1_3: Note;
  let e2_1: Note;

  beforeEach(() => {
    activity1 = MockRecurringActivity.create("activity 1");
    activity2 = MockRecurringActivity.create("activity 2");

    e1_1 = createEvent(moment("2020-01-01").toDate(), activity1.getId());
    e1_2 = createEvent(moment("2020-01-02").toDate(), activity1.getId());
    e1_3 = createEvent(moment("2020-03-02").toDate(), activity1.getId());
    e2_1 = createEvent(moment("2020-01-01").toDate(), activity2.getId());

    mockEntityMapper = jasmine.createSpyObj("EntityMapperService", [
      "save",
      "load",
      "loadType",
    ]);
    mockEntityMapper.save.and.resolveTo();
    mockEntityMapper.loadType.and.resolveTo([]);

    mockDbIndexing = jasmine.createSpyObj("DatabaseIndexingService", [
      "createIndex",
      "queryIndexDocsRange",
      "queryIndexDocs",
    ]);
    mockDbIndexing.createIndex.and.resolveTo();
    mockDbIndexing.queryIndexDocsRange.and.resolveTo([]);
    mockDbIndexing.queryIndexDocs.and.resolveTo([]);

    mockChildrenService = jasmine.createSpyObj("ChildrenService", [
      "getNotesInTimespan",
    ]);
    mockChildrenService.getNotesInTimespan.and.resolveTo([]);

    currentUserSubject = new BehaviorSubject<Entity | undefined>(undefined);

    mockEntityRegistry = jasmine.createSpyObj("EntityRegistry", ["has", "get"]);
    mockEntityRegistry.has.and.callFake(
      (name: string) => name === "RecurringActivity" || name === "Note",
    );
    mockEntityRegistry.get.and.callFake((name: string) => {
      if (name === "RecurringActivity") return MockRecurringActivity;
      if (name === "Note") return Note;
      return undefined;
    });

    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DatabaseIndexingService, useValue: mockDbIndexing },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: CurrentUserSubject, useValue: currentUserSubject },
        {
          provide: ConfigService,
          useValue: {
            configUpdates: new BehaviorSubject({
              data: {
                "appConfig:attendance": {
                  eventTypes: [
                    {
                      activityType: "RecurringActivity",
                      eventType: "Note",
                      activityAssignedUsersField: "assignedTo",
                      filterConfig: [{ id: "category" }],
                      extraField: "category",
                      fieldMapping: {
                        subject: "title",
                        category: "type",
                      },
                    },
                  ],
                },
              },
            }),
          },
        },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
        {
          provide: GroupParticipantResolverService,
          useValue: jasmine.createSpyObj("GroupParticipantResolverService", [
            "getActivitiesForParticipantViaGroups",
            "getActiveParticipantsOfActivity",
          ]),
        },
      ],
    });

    service = TestBed.inject(AttendanceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets events for a date", async () => {
    mockDbIndexing.queryIndexDocsRange.and.resolveTo([e1_1, e2_1]);

    const actualEvents = await service.getEventsOnDate(
      moment("2020-01-01").toDate(),
    );

    expect(actualEvents).toEqual(jasmine.arrayContaining([e1_1, e2_1]));
    expect(actualEvents).toHaveSize(2);
  });

  it("gets events including Notes for a date", async () => {
    const note1 = Note.create(
      moment("2020-01-01").toDate(),
      "manual event note 1",
    );
    note1.children.push("1");
    note1.children.push("2");
    note1.category = meetingInteractionCategory;

    const note2 = Note.create(
      moment("2020-01-02").toDate(),
      "manual event note 2",
    );
    note2.children.push("1");
    note2.category = meetingInteractionCategory;

    mockDbIndexing.queryIndexDocsRange.and.resolveTo([e1_1, e1_2, e2_1]);
    mockChildrenService.getNotesInTimespan.and.resolveTo([note1, note2]);

    const actualEvents = await service.getEventsOnDate(
      moment("2020-01-01").toDate(),
      moment("2020-01-02").toDate(),
    );

    expect(actualEvents).toHaveSize(5);
    expect(actualEvents).toEqual(
      jasmine.arrayContaining([e1_1, e1_2, e2_1, note1, note2]),
    );
  });

  it("gets empty array for a date without events", async () => {
    const actualEvents = await service.getEventsOnDate(
      moment("2007-01-01").toDate(),
    );
    expect(actualEvents).toEqual([]);
  });

  it("getActivityAttendances creates record for each month when there is at least one event", async () => {
    mockDbIndexing.queryIndexDocsRange.and.resolveTo([e1_1, e1_2, e1_3]);

    const actualAttendances = await service.getActivityAttendances(activity1);

    expect(actualAttendances).toHaveSize(2);

    expect(
      moment(actualAttendances[0].periodFrom).isSame(
        moment("2020-01-01"),
        "day",
      ),
    ).toBeTrue();
    expect(actualAttendances[0].events.map((e) => e.entity)).toEqual(
      jasmine.arrayContaining([e1_1, e1_2]),
    );
    expect(actualAttendances[0].activity).toEqual(activity1);

    expect(
      moment(actualAttendances[1].periodFrom).isSame(
        moment("2020-03-01"),
        "day",
      ),
    ).toBeTrue();
    expect(actualAttendances[1].events.map((e) => e.entity)).toEqual([e1_3]);
    expect(actualAttendances[1].activity).toEqual(activity1);
  });

  it("getActivitiesForParticipant gets all existing RecurringActivities where it is a participant", async () => {
    const testChildId = "c1";
    const testActivity1 = MockRecurringActivity.create("a1");
    testActivity1.participants.push(testChildId);

    mockDbIndexing.queryIndexDocs.and.resolveTo([testActivity1]);

    const actual = await service.getActivitiesForParticipant(testChildId);

    expect(actual).toEqual([testActivity1]);
  });

  it("should use only direct participants for event from activity (no group expansion)", async () => {
    const activity = new MockRecurringActivity();
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
    const sameDayEvent = Note.create(
      moment("2021-04-05").toDate(),
      "Same Day Event",
    );
    sameDayEvent.category = meetingInteractionCategory;

    mockDbIndexing.queryIndexDocsRange.and.resolveTo([sameDayEvent]);

    const events = await service.getEventsOnDate(datePickerDate);
    expect(events).toHaveSize(1);
    expect((events[0] as Note).subject).toBe(sameDayEvent.subject);
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

    beforeEach(() => {
      currentUserSubject.next(mockCurrentUser);

      activity1.assignedTo = ["User:other-user"];
      activity2.assignedTo = ["User:other-user"];

      // By default, loadType returns the two activities and queryIndexDocsRange returns no events
      mockEntityMapper.loadType.and.resolveTo([activity1, activity2]);
      mockDbIndexing.queryIndexDocsRange.and.resolveTo([]);
    });

    it("returns existing events for the date", async () => {
      const existingEvent = Note.create(testDate);
      existingEvent._rev = "1-existing"; // mark as not new

      mockDbIndexing.queryIndexDocsRange.and.resolveTo([existingEvent]);

      const result = await service.getAvailableEventsForRollCall(testDate);

      expect(result.allEvents.map((e) => e.entity.getId())).toContain(
        existingEvent.getId(),
      );
      expect(existingEvent.isNew).toBeFalse();
    });

    it("generates an event for each activity without an existing event on the date", async () => {
      const activity = MockRecurringActivity.create("new activity");
      mockEntityMapper.loadType.and.resolveTo([activity1, activity2, activity]);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const generatedEvent = findByActivity(result.allEvents, activity.getId());
      expect(generatedEvent).toBeTruthy();
      expect(generatedEvent.entity.isNew).toBeTrue();
    });

    it("does not generate a duplicate event when one already exists for the activity on that date", async () => {
      const activity = MockRecurringActivity.create("duplicate test");
      const existingEvent = Note.create(testDate, "existing");
      existingEvent.relatesTo = activity.getId();

      mockEntityMapper.loadType.and.resolveTo([activity1, activity2, activity]);
      mockDbIndexing.queryIndexDocsRange.and.resolveTo([existingEvent]);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const eventsForActivity = result.allEvents.filter(
        (e) => e.activityId === activity.getId(),
      );
      expect(eventsForActivity).toHaveSize(1);
    });

    it("filters to activities assigned to currentUserId in events, but allEvents contains all", async () => {
      const assignedActivity = MockRecurringActivity.create("assigned");
      assignedActivity.assignedTo = [mockCurrentUser.getId()];
      const otherActivity = MockRecurringActivity.create("other");
      otherActivity.assignedTo = ["User:other-user"];

      mockEntityMapper.loadType.and.resolveTo([
        activity1,
        activity2,
        assignedActivity,
        otherActivity,
      ]);

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
      currentUserSubject.next(undefined);

      const activityAssignedToOther = MockRecurringActivity.create("other");
      activityAssignedToOther.assignedTo = [mockCurrentUser.getId()];

      mockEntityMapper.loadType.and.resolveTo([
        activity1,
        activity2,
        activityAssignedToOther,
      ]);

      const result = await service.getAvailableEventsForRollCall(testDate);

      expect(
        findByActivity(result.events, activityAssignedToOther.getId()),
      ).toBeTruthy();
      expect(result.events.length).toBe(result.allEvents.length);
    });

    it("sets the currentUser as author on generated events", async () => {
      const activity = MockRecurringActivity.create("activity");
      mockEntityMapper.loadType.and.resolveTo([activity1, activity2, activity]);

      const result = await service.getAvailableEventsForRollCall(testDate);

      const generatedEvent = findByActivity(result.allEvents, activity.getId());
      expect(generatedEvent.assignedUsers).toEqual([mockCurrentUser.getId()]);
    });

    it("sorts events: assigned to current user ranked higher, one-time events ranked highest", async () => {
      const assignedActivity = MockRecurringActivity.create("assigned");
      assignedActivity.assignedTo = [mockCurrentUser.getId()];
      const unassignedActivity = MockRecurringActivity.create("unassigned");
      const oneTimeEvent = Note.create(testDate, "one-time");

      mockEntityMapper.loadType.and.resolveTo([
        activity1,
        activity2,
        assignedActivity,
        unassignedActivity,
      ]);
      mockDbIndexing.queryIndexDocsRange.and.resolveTo([oneTimeEvent]);

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

      expect(oneTimeIdx).toBeLessThan(unassignedIdx);
      expect(assignedIdx).toBeLessThan(unassignedIdx);
    });
  });
});
