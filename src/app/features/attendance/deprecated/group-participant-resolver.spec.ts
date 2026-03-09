import { TestBed, waitForAsync } from "@angular/core/testing";
import { AttendanceService } from "../attendance.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { ChildSchoolRelation } from "#src/app/child-dev-project/children/model/childSchoolRelation";
import { DatabaseTestingModule } from "#src/app/utils/database-testing.module";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { EventNote } from "../model/event-note";
import { AttendanceItem } from "../model/attendance-item";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";

/**
 * @deprecated Tests for group-based participant resolution (linked schools → participants).
 * This functionality is deprecated; use direct `participants` field on activity entities instead.
 */
describe("GroupParticipantResolver (deprecated)", () => {
  let service: AttendanceService;
  let entityMapper: EntityMapperService;

  const meetingInteractionCategory = defaultInteractionTypes.find(
    (it) => it.isMeeting,
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });
    service = TestBed.inject(AttendanceService);
    entityMapper = TestBed.inject(EntityMapperService);
  }));

  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("gets events and loads additional participants from linked schools", async () => {
    const linkedSchoolId = "test_school";
    await createChildrenInSchool(linkedSchoolId, ["2", "3"]);
    const date = new Date();

    const testNoteWithSchool = Note.create(date);
    testNoteWithSchool.children = ["1", "2"];
    testNoteWithSchool.childrenAttendance = [
      new AttendanceItem(undefined, "", "1"),
      new AttendanceItem(undefined, "", "2"),
    ];
    testNoteWithSchool.schools = [linkedSchoolId];
    testNoteWithSchool.category = meetingInteractionCategory;
    await entityMapper.save(testNoteWithSchool);

    // NOTE: getEventsWithUpdatedParticipants no longer expands group participants.
    // This test documents the old behaviour; the returned events now only contain
    // their stored participants.
    const actualEvents = await service.getEventsOnDate(date, date);
    expect(actualEvents).toHaveSize(1);
  });

  it("should create an event without the excluded participants", async () => {
    const linkedSchoolId = "test_school";
    await createChildrenInSchool(linkedSchoolId, ["excluded", "member"]);

    const activity = new RecurringActivity();
    activity.linkedGroups = [linkedSchoolId];
    activity.excludedParticipants = ["excluded"];
    activity.participants = ["direct", "excluded"];

    // After Phase 1 simplification: only direct participants minus excluded are used.
    // Group members from linkedGroups are no longer resolved automatically.
    const event = await service.createEventForActivity(activity, new Date());
    expect(event.attendanceItems.map((a) => a.participant)).toEqual(
      jasmine.arrayWithExactContents(["direct"]),
    );
  });

  it("should include children from a linked school for event from activity (legacy behaviour removed)", async () => {
    const activity = new RecurringActivity();
    const linkedSchool = createEntityOfType("School");
    activity.linkedGroups.push(linkedSchool.getId());

    const mockQueryRelations = spyOn(
      TestBed.inject(ChildrenService),
      "queryActiveRelationsOf",
    ).and.resolveTo([]);

    const directlyAddedChild = new TestEntity();
    activity.participants.push(directlyAddedChild.getId());
    const date = new Date();

    const event = await service.createEventForActivity(activity, date);

    // After Phase 1: linkedGroups are no longer resolved; only direct participants are used.
    expect(mockQueryRelations).not.toHaveBeenCalled();
    expect(event.attendanceItems).toHaveSize(1);
    expect(event.attendanceItems.map((a) => a.participant)).toContain(
      directlyAddedChild.getId(),
    );
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
