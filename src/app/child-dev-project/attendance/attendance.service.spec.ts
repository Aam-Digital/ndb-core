import { TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "./model/recurring-activity";
import moment from "moment";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { EventNote } from "./model/event-note";
import { ChildrenService } from "../children/children.service";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { Note } from "../notes/model/note";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { Entity } from "../../core/entity/model/entity";
import { createEntityOfType } from "../../core/demo-data/create-entity-of-type";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";

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
    expect(actualEvents).toBeEmpty();
  });

  it("gets events and loads additional participants from linked schools", async () => {
    const linkedSchoolId = "test_school";
    await createChildrenInSchool(linkedSchoolId, ["2", "3"]);
    const date = new Date();

    const testNoteWithSchool = Note.create(date);
    testNoteWithSchool.children = ["1", "2"];
    testNoteWithSchool.schools = [linkedSchoolId];
    testNoteWithSchool.category = meetingInteractionCategory;
    await entityMapper.save(testNoteWithSchool);

    const actualEvents = await service.getEventsWithUpdatedParticipants(date);
    expect(actualEvents).toHaveSize(1);
    expect(actualEvents[0].children).toEqual(
      jasmine.arrayWithExactContents(["1", "2", "3"]),
    );
  });

  it("should create an event without the excluded participants", async () => {
    const linkedSchoolId = "test_school";
    await createChildrenInSchool(linkedSchoolId, ["excluded", "member"]);

    const activity = new RecurringActivity();
    activity.linkedGroups = [linkedSchoolId];
    activity.excludedParticipants = ["excluded"];
    activity.participants = ["direct", "excluded"];

    const event = await service.createEventForActivity(activity, new Date());
    expect(event.children).toEqual(
      jasmine.arrayWithExactContents(["member", "direct"]),
    );
  });

  it("gets events for an activity", async () => {
    const actualEvents = await service.getEventsForActivity(activity1.getId());
    expectEntitiesToMatch(actualEvents, [e1_1, e1_2, e1_3]);
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
    expectEntitiesToMatch(actualAttendances[0].events, [e1_1, e1_2]);
    expect(actualAttendances[0].activity).toEqual(activity1);

    expect(
      moment(actualAttendances[1].periodFrom).isSame(
        moment("2020-03-01"),
        "day",
      ),
    ).toBeTrue();
    expectEntitiesToMatch(actualAttendances[1].events, [e1_3]);
    expect(actualAttendances[1].activity).toEqual(activity1);
  });

  it("getAllActivityAttendancesForPeriod creates records for every activity with events in the given period", async () => {
    const actualAttendences = await service.getAllActivityAttendancesForPeriod(
      new Date(2020, 0, 1),
      new Date(2020, 0, 5),
    );

    expect(actualAttendences).toHaveSize(2);
    expectEntitiesToMatch(
      actualAttendences.find((t) => t.activity.getId() === activity1.getId())
        .events,
      [e1_1, e1_2],
    );
    expectEntitiesToMatch(
      actualAttendences.find((t) => t.activity.getId() === activity2.getId())
        .events,
      [e2_1],
    );

    expect(actualAttendences[0].periodFrom).toBeDate("2020-01-01");
    expect(actualAttendences[0].periodTo).toBeDate("2020-01-05");
    expect(actualAttendences[1].periodFrom).toBeDate("2020-01-01");
    expect(actualAttendences[1].periodTo).toBeDate("2020-01-05");
  });

  it("getActivitiesForChild gets all existing RecurringActivities where it is a participant", async () => {
    const testChildId = "c1";
    const testActivity1 = RecurringActivity.create("a1");
    testActivity1.participants.push(testChildId);

    await entityMapper.save(testActivity1);

    const actual = await service.getActivitiesForChild(testChildId);

    expectEntitiesToMatch(actual, [testActivity1]); // and does not include defaults activity1 or activity2
  });

  it("should return activities of a school that the child currently visits", async () => {
    const childSchoolRelation = new ChildSchoolRelation();
    childSchoolRelation.childId = "testChild";
    childSchoolRelation.schoolId = "testSchool";
    childSchoolRelation.start = moment("2020-01-01").toDate();
    const testActivity = RecurringActivity.create("new activity");
    testActivity.linkedGroups.push("testSchool");

    await entityMapper.saveAll([testActivity, childSchoolRelation]);

    const activities = await service.getActivitiesForChild("testChild");
    expectEntitiesToMatch(activities, [testActivity]);
  });

  it("should only return activities for active schools", async () => {
    const activeRelation1 = new ChildSchoolRelation();
    activeRelation1.childId = "testChild";
    activeRelation1.schoolId = "activeSchool1";
    activeRelation1.start = moment().subtract(1, "month").toDate();
    const activeRelation2 = new ChildSchoolRelation();
    activeRelation2.childId = "testChild";
    activeRelation2.schoolId = "activeSchool2";
    activeRelation2.start = new Date();
    const inactiveRelation = new ChildSchoolRelation();
    inactiveRelation.childId = "testChild";
    inactiveRelation.schoolId = "inactiveSchool";
    inactiveRelation.start = moment().subtract(1, "year").toDate();
    inactiveRelation.end = moment().subtract(1, "month").toDate();

    const activeActivity1 = RecurringActivity.create("active activity 1");
    activeActivity1.linkedGroups.push(activeRelation1.schoolId);
    const activeActivity2 = RecurringActivity.create("active activity 2");
    activeActivity2.linkedGroups.push(activeRelation2.schoolId);
    const inactiveActivity = RecurringActivity.create("inactive activity");
    inactiveActivity.linkedGroups.push(inactiveRelation.schoolId);

    await entityMapper.saveAll([
      activeRelation1,
      inactiveRelation,
      activeRelation2,
      activeActivity1,
      activeActivity2,
      inactiveActivity,
    ]);

    const activities = await service.getActivitiesForChild("testChild");
    expectEntitiesToMatch(activities, [activeActivity1, activeActivity2]);
  });

  it("should not return the same activity multiple times", async () => {
    const activity = new RecurringActivity();
    const relation = new ChildSchoolRelation();
    relation.schoolId = "test school";
    relation.childId = "test child";
    relation.start = new Date();
    activity.linkedGroups.push(relation.schoolId);
    activity.participants.push(relation.childId);

    await entityMapper.saveAll([activity, relation]);

    const activities = await service.getActivitiesForChild(relation.childId);

    expectEntitiesToMatch(activities, [activity]);
  });

  it("should include children from a linked school for event from activity", async () => {
    const activity = new RecurringActivity();
    const linkedSchool = createEntityOfType("School");
    activity.linkedGroups.push(linkedSchool.getId());

    const childAttendingSchool = new ChildSchoolRelation();
    childAttendingSchool.childId = "child attending school";
    const mockQueryRelations = spyOn(
      TestBed.inject(ChildrenService),
      "queryActiveRelationsOf",
    ).and.resolveTo([childAttendingSchool]);

    const directlyAddedChild = new TestEntity();
    activity.participants.push(directlyAddedChild.getId());
    const date = new Date();

    const event = await service.createEventForActivity(activity, date);

    expect(mockQueryRelations).toHaveBeenCalledWith(linkedSchool.getId(), date);
    expect(event.children).toHaveSize(2);
    expect(event.children).toContain(directlyAddedChild.getId());
    expect(event.children).toContain(childAttendingSchool.childId);
  });

  it("should not include duplicate children for event from activity", async () => {
    const activity = new RecurringActivity();
    const linkedSchool = createEntityOfType("School");
    activity.linkedGroups.push(linkedSchool.getId());

    const duplicateChild = new TestEntity();
    const duplicateChildRelation = new ChildSchoolRelation();
    duplicateChildRelation.childId = duplicateChild.getId();
    duplicateChildRelation.schoolId = linkedSchool.getId();
    const anotherRelation = new ChildSchoolRelation();
    anotherRelation.childId = Entity.createPrefixedId(
      TestEntity.ENTITY_TYPE,
      "another_child_id",
    );
    anotherRelation.schoolId = linkedSchool.getId();
    await entityMapper.saveAll([duplicateChildRelation, anotherRelation]);

    const directlyAddedChild = new TestEntity();
    activity.participants.push(
      directlyAddedChild.getId(),
      duplicateChild.getId(),
    );

    const event = await service.createEventForActivity(activity, new Date());

    expect(event.children).toHaveSize(3);
    expect(event.children).toContain(directlyAddedChild.getId());
    expect(event.children).toContain(duplicateChild.getId());
    expect(event.children).toContain(anotherRelation.childId);
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
    expect(events[0].subject).toBe(sameDayEvent.subject);
  });

  async function createChildrenInSchool(
    schoolId: string,
    childrenIds: string[],
  ) {
    for (const childId of childrenIds) {
      const childSchool = new ChildSchoolRelation();
      childSchool.childId = childId;
      childSchool.schoolId = schoolId;
      childSchool.start = new Date();
      await entityMapper.save(childSchool);
    }
  }
});
