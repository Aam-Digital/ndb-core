import { TestBed } from "@angular/core/testing";
import { AttendanceService } from "../attendance.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { ChildSchoolRelation } from "#src/app/child-dev-project/children/model/childSchoolRelation";
import { DatabaseTestingModule } from "#src/app/utils/database-testing.module";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { AttendanceItem } from "../model/attendance-item";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { GroupParticipantResolverService } from "./group-participant-resolver";
import { ConfigService } from "#src/app/core/config/config.service";

/**
 * @deprecated Tests for group-based participant resolution (linked schools → participants).
 * This functionality is deprecated; use direct `participants` field on activity entities instead.
 */
describe("GroupParticipantResolverService (deprecated)", () => {
  let service: AttendanceService;
  let resolverService: GroupParticipantResolverService;
  let entityMapper: EntityMapperService;

  const meetingInteractionCategory = defaultInteractionTypes.find(
    (it) => it.isMeeting,
  );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });

    service = TestBed.inject(AttendanceService);
    resolverService = TestBed.inject(GroupParticipantResolverService);
    entityMapper = TestBed.inject(EntityMapperService);

    const configService = TestBed.inject(ConfigService);
    const currentConfig = configService.exportConfig(true) as Record<
      string,
      unknown
    >;
    currentConfig[AttendanceService.CONFIG_KEY] = {
      eventTypes: [
        {
          activityType: "RecurringActivity",
          eventType: "Note",
          dateField: "date",
          participantsField: "participants",
          attendanceField: "childrenAttendance",
          relatesToField: "relatesTo",
          fieldMapping: {
            schools: "linkedGroups",
            category: "type",
          },
        },
      ],
    };

    await configService.saveConfig(currentConfig);

    await vi.waitFor(
      () => {
        const hasLegacyRecurringConfig = service["eventTypeSettings"]?.some(
          (s) =>
            s.activityType?.ENTITY_TYPE === "RecurringActivity" &&
            s.eventType.ENTITY_TYPE === "Note",
        );
        expect(hasLegacyRecurringConfig).toBe(true);
      },
      { timeout: 10_000 },
    );

    // Keep exercising deprecated linkedGroups participant resolution in this test suite.
    service["groupBasedParticipants"] = true;
  });

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

    const actualEvents = await service.getEventsOnDate(date, date);
    expect(actualEvents).toHaveLength(1);
    expect(actualEvents[0].getId()).toBe(testNoteWithSchool.getId());
  });

  it("filterExcludedParticipants filters excluded participants from a list", () => {
    // Previously this filtering was applied automatically in createEventForActivity.
    // It is now available as an explicit deprecated static helper for callers that still need it.
    const result = GroupParticipantResolverService.filterExcludedParticipants(
      ["direct", "excluded"],
      ["excluded"],
    );
    expect(result).toEqual(["direct"]);
  });

  it("should include children from a linked school for event from activity", async () => {
    const activity = Object.assign(createEntityOfType("RecurringActivity"), {
      linkedGroups: [],
      participants: [],
      excludedParticipants: [],
      assignedTo: [],
    });
    const linkedSchool = createEntityOfType("School");
    activity.linkedGroups.push(linkedSchool.getId());

    const date = new Date();
    const linkedGroupChild = new TestEntity();

    const mockQueryRelations = vi
      .spyOn(TestBed.inject(ChildrenService), "queryActiveRelationsOf")
      .mockResolvedValue([
        Object.assign(new ChildSchoolRelation(), {
          childId: linkedGroupChild.getId(),
          schoolId: linkedSchool.getId(),
          start: date,
        }),
      ]);

    const directlyAddedChild = new TestEntity();
    activity.participants.push(directlyAddedChild.getId());

    const event = await service.createEventForActivity(activity, date);

    expect(mockQueryRelations).toHaveBeenCalledTimes(1);
    expect(event.attendanceItems).toHaveLength(2);
    expect(event.attendanceItems.map((a) => a.participant)).toEqual(
      expect.arrayContaining([
        ,
        directlyAddedChild.getId(),
        linkedGroupChild.getId(),
      ]),
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
