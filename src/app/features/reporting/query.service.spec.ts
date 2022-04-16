import { TestBed } from "@angular/core/testing";

import {
  AttendanceInfo,
  AttendanceReport,
  QueryService,
} from "./query.service";
import { Child } from "../../child-dev-project/children/model/child";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { School } from "../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { defaultAttendanceStatusTypes } from "../../core/config/default-config/default-attendance-status-types";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "../../child-dev-project/attendance/attendance.service";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { Database } from "../../core/database/database";
import { ConfigurableEnumModule } from "../../core/configurable-enum/configurable-enum.module";
import { Note } from "../../child-dev-project/notes/model/note";
import { genders } from "../../child-dev-project/children/model/genders";
import { EntityConfigService } from "app/core/entity/entity-config.service";
import { ConfigService } from "app/core/config/config.service";
import { EventAttendance } from "../../child-dev-project/attendance/model/event-attendance";
import { AttendanceStatusType } from "../../child-dev-project/attendance/model/attendance-status";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { ChildrenModule } from "../../child-dev-project/children/children.module";

describe("QueryService", () => {
  let service: QueryService;
  let entityMapper: EntityMapperService;

  const presentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "PRESENT"
  );
  const absentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "ABSENT"
  );

  const schoolClass = defaultInteractionTypes.find(
    (i) => i.id === "SCHOOL_CLASS"
  );
  const coachingClass = defaultInteractionTypes.find(
    (i) => i.id === "COACHING_CLASS"
  );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ConfigurableEnumModule, DatabaseTestingModule, ChildrenModule],
      providers: [
        ChildrenService,
        AttendanceService,
        ConfigService,
        EntityConfigService,
      ],
    });
    service = TestBed.inject(QueryService);
    const configService = TestBed.inject(ConfigService);
    const entityConfigService = TestBed.inject(EntityConfigService);
    entityMapper = TestBed.inject(EntityMapperService);
    await configService.loadConfig();
    entityConfigService.addConfigAttributes(School);
    entityConfigService.addConfigAttributes(Child);
  });

  afterEach(async () => {
    await TestBed.inject(Database).destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return all children with specified attributes", async () => {
    const maleChristian = await createChild("M", "christian");
    const male = await createChild("M");
    const femaleChristian = await createChild("F", "christian");
    const femaleMuslim = await createChild("F", "muslim");

    const maleChristianQuery = `${Child.ENTITY_TYPE}:toArray:filterByObjectAttribute(gender, id, M)[*religion=christian]`;
    const maleChristians = await service.queryData(maleChristianQuery);
    expectEntitiesToMatch(maleChristians, [maleChristian]);

    const femaleQuery = `${Child.ENTITY_TYPE}:toArray:filterByObjectAttribute(gender, id, F)`;
    const females = await service.queryData(femaleQuery);
    expectEntitiesToMatch(females, [femaleChristian, femaleMuslim]);

    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expectEntitiesToMatch(allChildren, [
      maleChristian,
      male,
      femaleChristian,
      femaleMuslim,
    ]);
  });

  it("should return all children attending a school based on attributes", async () => {
    const maleChildPrivate = await createChild("M");
    const maleChildNormal = await createChild("M");
    const femaleChildNormal = await createChild("F");
    await createChild("F");
    await createSchool([maleChildPrivate], true);
    await createSchool([maleChildNormal, femaleChildNormal]);

    const maleChildrenOnPrivateSchoolsQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities:filterByObjectAttribute(gender, id, M)`;

    const maleChildrenOnPrivateSchools = await service.queryData(
      maleChildrenOnPrivateSchoolsQuery
    );
    expectEntitiesToMatch(maleChildrenOnPrivateSchools, [maleChildPrivate]);

    const childrenVisitingAnySchoolQuery = `
      ${School.ENTITY_TYPE}:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenVisitingAnySchool = await service.queryData(
      childrenVisitingAnySchoolQuery
    );
    expectEntitiesToMatch(childrenVisitingAnySchool, [
      femaleChildNormal,
      maleChildNormal,
      maleChildPrivate,
    ]);
  });

  it("should allow to query data multiple times", async () => {
    const maleChristian = await createChild("M", "christian");
    const male = await createChild("M");
    const femaleChristian = await createChild("F", "christian");
    const femaleMuslim = await createChild("F", "muslim");

    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expectEntitiesToMatch(allChildren, [
      maleChristian,
      male,
      femaleChristian,
      femaleMuslim,
    ]);

    const maleChildrenCountQuery = `:filterByObjectAttribute(gender, id, M):count`;
    const maleChildrenCount = await service.queryData(
      maleChildrenCountQuery,
      null,
      null,
      allChildren
    );
    expect(maleChildrenCount).toBe(2);

    const christianCountQuery = `[*religion=christian]:count`;
    const christianCount = await service.queryData(
      christianCountQuery,
      null,
      null,
      allChildren
    );
    expect(christianCount).toBe(2);

    const maleChristiansCountQuery = `:filterByObjectAttribute(gender, id, M)[*religion=christian]:count`;
    const maleChristiansCount = await service.queryData(
      maleChristiansCountQuery,
      null,
      null,
      allChildren
    );
    expect(maleChristiansCount).toBe(1);
  });

  it("should return attended children in timespan", async () => {
    const maleChristian = await createChild("M", "christian");
    const male = await createChild("M");
    const femaleChristian = await createChild("F", "christian");
    const femaleMuslim = await createChild("F", "muslim");
    await createNote(moment().subtract(2, "weeks").toDate(), [
      { child: male, status: presentAttendanceStatus },
      { child: femaleMuslim, status: presentAttendanceStatus },
    ]);
    await createNote(moment().subtract(3, "days").toDate(), [
      { child: male, status: absentAttendanceStatus },
      { child: femaleMuslim, status: presentAttendanceStatus },
    ]);
    await createNote(new Date(), [
      { child: maleChristian, status: presentAttendanceStatus },
      { child: femaleChristian, status: presentAttendanceStatus },
      { child: femaleMuslim, status: presentAttendanceStatus },
    ]);

    const childrenThatAttendedSomethingQuery = `
      ${EventNote.ENTITY_TYPE}:toArray[*date > ?]
      :getParticipantsWithAttendance(PRESENT)
      :addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenThatAttendedSomething = await service.queryData(
      childrenThatAttendedSomethingQuery,
      moment().subtract(1, "week").toDate()
    );
    expectEntitiesToMatch(childrenThatAttendedSomething, [
      femaleChristian,
      maleChristian,
      femaleMuslim,
    ]);
  });

  it("should count unique participants of events based on school and activity", async () => {
    const malePrivateAbsent = await createChild("M");
    const malePrivatePresent = await createChild("M");
    const femalePrivateAbsent = await createChild("F");
    const femalePrivatePresent = await createChild("F");
    const femaleNormalPresent = await createChild("F");
    const privateSchool = await createSchool([], true);
    const normalSchool = await createSchool([]);
    const privateActivity = await createActivity([privateSchool]);
    const normalActivity = await createActivity([normalSchool]);
    await createNote(
      new Date(),
      [
        { child: malePrivateAbsent, status: absentAttendanceStatus },
        { child: malePrivatePresent, status: presentAttendanceStatus },
        { child: femalePrivateAbsent, status: absentAttendanceStatus },
        { child: femalePrivatePresent, status: presentAttendanceStatus },
      ],
      privateActivity
    );
    await createNote(
      new Date(),
      [{ child: femaleNormalPresent, status: presentAttendanceStatus }],
      normalActivity
    );

    const femaleParticipantsPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities:filterByObjectAttribute(gender, id, F)`;
    const femaleParticipantsInPrivateSchools = await service.queryData(
      femaleParticipantsPrivateSchoolQuery
    );
    expectEntitiesToMatch(femaleParticipantsInPrivateSchools, [
      femalePrivatePresent,
    ]);

    const participantsNotPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool!=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const participantsNotPrivateSchool = await service.queryData(
      participantsNotPrivateSchoolQuery
    );
    expectEntitiesToMatch(participantsNotPrivateSchool, [femaleNormalPresent]);

    const attendedParticipantsQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const attendedParticipants = await service.queryData(
      attendedParticipantsQuery
    );
    expectEntitiesToMatch(attendedParticipants, [
      femalePrivatePresent,
      femaleNormalPresent,
      malePrivatePresent,
    ]);
  });

  it("should allow queries on complex attributes", async () => {
    const schoolActivity = await createActivity([], schoolClass);
    const coachingActivity = await createActivity([], coachingClass);
    const coachingActivity2 = await createActivity([], coachingClass);

    const schoolClassActivitiesQuery = `${RecurringActivity.ENTITY_TYPE}:toArray:filterByObjectAttribute(type, id, SCHOOL_CLASS)`;
    const schoolClassActivities = await service.queryData(
      schoolClassActivitiesQuery
    );
    expectEntitiesToMatch(schoolClassActivities, [schoolActivity]);

    const otherActivitiesQuery = `${RecurringActivity.ENTITY_TYPE}:toArray:filterByObjectAttribute(type, id, COACHING_CLASS)`;
    const otherActivities = await service.queryData(otherActivitiesQuery);
    expectEntitiesToMatch(otherActivities, [
      coachingActivity,
      coachingActivity2,
    ]);
  });

  it("should not load all data if a from date is provided", async () => {
    const oneWeekAgo = await createNote(moment().subtract(1, "week").toDate());
    const threeDaysAgo = await createNote(
      moment().subtract(3, "days").toDate()
    );
    const today = await createNote(new Date());
    await createNote(moment().subtract(2, "week").toDate());

    const allEventsLastWeek: string[] = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray.entityId`,
      moment().subtract(1, "week").toDate()
    );
    expect(allEventsLastWeek).toEqual(
      jasmine.arrayWithExactContents([
        oneWeekAgo.getId(),
        threeDaysAgo.getId(),
        today.getId(),
      ])
    );
  });

  it("should load more events if a later date is provided", async () => {
    await createNote(moment().subtract(2, "week").toDate());
    const threeDaysAgo = await createNote(
      moment().subtract(3, "days").toDate()
    );
    const today = await createNote(new Date());
    const allNotesQuery = `${EventNote.ENTITY_TYPE}:toArray`;

    const allNotesLastTwoDays = await service.queryData(
      allNotesQuery,
      moment().subtract(1, "days").toDate()
    );

    expectEntitiesToMatch(allNotesLastTwoDays, [today]);

    const allNotesLastWeek = await service.queryData(
      allNotesQuery,
      moment().subtract(1, "week").toDate()
    );

    expectEntitiesToMatch(allNotesLastWeek, [today, threeDaysAgo]);
  });

  it("should add notes to an array of event notes", async () => {
    const note1 = new Note();
    note1.date = new Date();
    await entityMapper.save(note1);
    const note2 = new Note();
    note2.date = new Date();
    await entityMapper.save(note2);
    const eventNote = await createNote(new Date(), []);

    const onlyEvents = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray`
    );
    expectEntitiesToMatch(onlyEvents, [eventNote]);

    const eventsWithNotes = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray:addEntities(${Note.ENTITY_TYPE})`
    );

    expectEntitiesToMatch(eventsWithNotes, [note1, note2, eventNote]);
  });

  it("should do addPrefix as part of toEntities if optional parameter is given", async () => {
    const child1 = await createChild();
    const child2 = await createChild();
    const child3 = await createChild();
    await createSchool([child1, child3, child2]);

    const queryWithAddPrefix = `
      ${School.ENTITY_TYPE}:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      .childId:addPrefix(${Child.ENTITY_TYPE}):toEntities.gender`;
    const queryWithoutAddPrefix = `
      ${School.ENTITY_TYPE}:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      .childId:toEntities(${Child.ENTITY_TYPE}).gender`;

    const resultWithAddPrefix = await service.queryData(queryWithAddPrefix);
    const resultWithoutAddPrefix = await service.queryData(
      queryWithoutAddPrefix
    );

    expect(resultWithoutAddPrefix).toHaveSize(3);
    expect(resultWithoutAddPrefix).toEqual(resultWithAddPrefix);
  });

  it("should create an attendance array with the current school", async () => {
    const presentTwiceWithSchool = await createChild();
    const presentOnceWithoutSchool = await createChild();
    const alwaysAbsentWithSchool = await createChild();
    const school = await createSchool([
      presentTwiceWithSchool,
      alwaysAbsentWithSchool,
    ]);
    const activity = await createActivity([school]);
    await createNote(
      new Date(),
      [
        { child: presentTwiceWithSchool, status: presentAttendanceStatus },
        { child: presentOnceWithoutSchool, status: presentAttendanceStatus },
        { child: alwaysAbsentWithSchool, status: absentAttendanceStatus },
      ],
      activity
    );
    await createNote(
      new Date(),
      [{ child: presentOnceWithoutSchool, status: absentAttendanceStatus }],
      activity
    );
    await createNote(new Date(), [
      { child: alwaysAbsentWithSchool, status: absentAttendanceStatus },
      { child: presentTwiceWithSchool, status: presentAttendanceStatus },
    ]);

    const attendanceArrayQuery = `${EventNote.ENTITY_TYPE}:toArray:getAttendanceArray(true)`;

    const attendanceResult: AttendanceInfo = await service.queryData(
      attendanceArrayQuery
    );

    expect(attendanceResult).toContain({
      participant: presentTwiceWithSchool.getId(),
      school: school.getId(),
      status: new EventAttendance(presentAttendanceStatus),
    });
    expect(attendanceResult).toContain({
      participant: presentTwiceWithSchool.getId(),
      status: new EventAttendance(presentAttendanceStatus),
    });
    expect(attendanceResult).toContain({
      participant: presentOnceWithoutSchool.getId(),
      status: new EventAttendance(presentAttendanceStatus),
    });
    expect(attendanceResult).toContain({
      participant: presentOnceWithoutSchool.getId(),
      status: new EventAttendance(absentAttendanceStatus),
    });
    expect(attendanceResult).toContain({
      participant: alwaysAbsentWithSchool.getId(),
      school: school.getId(),
      status: new EventAttendance(absentAttendanceStatus),
    });
    expect(attendanceResult).toContain({
      participant: alwaysAbsentWithSchool.getId(),
      status: new EventAttendance(absentAttendanceStatus),
    });
  });

  it("should create a attendance report with percentages", async () => {
    const presentTwice = await createChild();
    const presentOnce = await createChild();
    const alwaysAbsent = await createChild();
    await createNote(new Date(), [
      { child: presentTwice, status: presentAttendanceStatus },
      { child: presentOnce, status: presentAttendanceStatus },
      { child: alwaysAbsent, status: absentAttendanceStatus },
    ]);
    await createNote(new Date(), [
      { child: presentOnce, status: absentAttendanceStatus },
    ]);
    await createNote(new Date(), [
      { child: alwaysAbsent, status: absentAttendanceStatus },
      { child: presentTwice, status: presentAttendanceStatus },
    ]);

    const reportQuery = `${EventNote.ENTITY_TYPE}:toArray:getAttendanceArray:getAttendanceReport`;

    const report: AttendanceReport[] = await service.queryData(reportQuery);

    expect(report).toContain({
      participant: presentTwice.getId(),
      present: 2,
      total: 2,
      percentage: "1.00",
    });
    expect(report).toContain({
      participant: presentOnce.getId(),
      present: 1,
      total: 2,
      percentage: "0.50",
    });
    expect(report).toContain({
      participant: alwaysAbsent.getId(),
      present: 0,
      total: 2,
      percentage: "0.00",
    });
  });

  it("should allow to set custom strings", async () => {
    await createChild();
    await createChild();

    const result = await service.queryData(
      `${Child.ENTITY_TYPE}:toArray:setString(custom-string)`
    );

    expect(result).toEqual(["custom-string", "custom-string"]);
  });

  it("should omit participants which can be found anymore (e.g. deleted participants)", async () => {
    const maleChild = await createChild("M");
    const femaleChild = await createChild("F");
    await createNote(new Date(), [
      { child: maleChild, status: presentAttendanceStatus },
      { child: femaleChild, status: presentAttendanceStatus },
    ]);
    await entityMapper.remove(femaleChild);

    const result = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray:getIds(children):toEntities(${Child.ENTITY_TYPE}).gender`
    );

    expect(result).toEqual([maleChild.gender]);
  });

  async function createChild(
    gender: "M" | "F" = "F",
    religion?: "muslim" | "christian"
  ): Promise<Child> {
    const child = new Child();
    child.gender = genders.find((g) => g.id === gender);
    child["religion"] = religion;
    await entityMapper.save(child);
    return child;
  }

  async function createSchool(
    children: Child[] = [],
    privateSchool?: boolean
  ): Promise<School> {
    const school = new School();
    school["privateSchool"] = privateSchool;
    await entityMapper.save(school);
    for (const child of children) {
      const relation = new ChildSchoolRelation();
      relation.childId = child.getId();
      relation.schoolId = school.getId();
      relation.start = new Date();
      await entityMapper.save(relation);
    }
    return school;
  }

  async function createNote(
    date: Date,
    children: { child: Child; status: AttendanceStatusType }[] = [],
    activity?: RecurringActivity
  ): Promise<EventNote> {
    const event = new EventNote();
    event.date = date;
    event.children = [];
    event.category = activity?.type || schoolClass;
    event.schools = activity?.linkedGroups || [];
    event.relatesTo = activity?.getId();
    children.forEach((child) => {
      event.addChild(child.child);
      event.getAttendance(child.child).status = child.status;
    });
    await entityMapper.save(event);
    return event;
  }

  async function createActivity(
    schools: School[],
    category = schoolClass
  ): Promise<RecurringActivity> {
    const activity = new RecurringActivity();
    activity.linkedGroups = schools.map((s) => s.getId());
    activity.type = category;
    await entityMapper.save(activity);
    return activity;
  }
});
