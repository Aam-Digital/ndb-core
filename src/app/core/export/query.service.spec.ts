import { TestBed, waitForAsync } from "@angular/core/testing";

import {
  AttendanceInfo,
  AttendanceReport,
  QueryService,
} from "./query.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import moment from "moment";
import { defaultAttendanceStatusTypes } from "../config/default-config/default-attendance-status-types";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { Note } from "../../child-dev-project/notes/model/note";
import { genders } from "../../child-dev-project/children/model/genders";
import { EventAttendance } from "../../child-dev-project/attendance/model/event-attendance";
import { AttendanceStatusType } from "../../child-dev-project/attendance/model/attendance-status";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "../../child-dev-project/attendance/attendance.service";
import { Entity } from "../entity/model/entity";
import { entityRegistry } from "../entity/database-entity.decorator";
import { DatabaseResolverService } from "../database/database-resolver.service";

describe("QueryService", () => {
  let service: QueryService;
  let entityMapper: EntityMapperService;

  const presentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "PRESENT",
  );
  const absentAttendanceStatus = defaultAttendanceStatusTypes.find(
    (status) => status.countAs === "ABSENT",
  );

  const schoolClass = defaultInteractionTypes.find(
    (i) => i.id === "SCHOOL_CLASS",
  );
  const coachingClass = defaultInteractionTypes.find(
    (i) => i.id === "COACHING_CLASS",
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });
    service = TestBed.inject(QueryService);
    entityMapper = TestBed.inject(EntityMapperService);
  }));

  afterEach(async () => {
    await TestBed.inject(DatabaseResolverService).destroyDatabases();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return all children with specified attributes", async () => {
    const maleChristian = await createChild("M", "christian");
    const male = await createChild("M");
    const femaleChristian = await createChild("F", "christian");
    const femaleMuslim = await createChild("F", "muslim");

    const maleChristianQuery = `Child:toArray:filterByObjectAttribute(gender, id, M)[*religion=christian]`;
    const maleChristians = await queryData(maleChristianQuery);
    expectEntitiesToMatch(maleChristians, [maleChristian]);

    const femaleQuery = `Child:toArray:filterByObjectAttribute(gender, id, F)`;
    const females = await queryData(femaleQuery);
    expectEntitiesToMatch(females, [femaleChristian, femaleMuslim]);

    const allChildren = await queryData(`Child:toArray`);
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
      School:toArray[*privateSchool=true]
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:unique:toEntities(Child)
      :filterByObjectAttribute(gender, id, M)`;

    const maleChildrenOnPrivateSchools = await queryData(
      maleChildrenOnPrivateSchoolsQuery,
    );
    expectEntitiesToMatch(maleChildrenOnPrivateSchools, [maleChildPrivate]);

    const childrenVisitingAnySchoolQuery = `
      School:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:unique:toEntities(Child)`;
    const childrenVisitingAnySchool = await queryData(
      childrenVisitingAnySchoolQuery,
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

    const allChildren = await queryData(`Child:toArray`);
    expectEntitiesToMatch(allChildren, [
      maleChristian,
      male,
      femaleChristian,
      femaleMuslim,
    ]);

    const maleChildrenCountQuery = `:filterByObjectAttribute(gender, id, M):count`;
    const maleChildrenCount = await queryData(
      maleChildrenCountQuery,
      null,
      null,
      allChildren,
    );
    expect(maleChildrenCount).toBe(2);

    const christianCountQuery = `[*religion=christian]:count`;
    const christianCount = await queryData(
      christianCountQuery,
      null,
      null,
      allChildren,
    );
    expect(christianCount).toBe(2);

    const maleChristiansCountQuery = `:filterByObjectAttribute(gender, id, M)[*religion=christian]:count`;
    const maleChristiansCount = await queryData(
      maleChristiansCountQuery,
      null,
      null,
      allChildren,
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
      :unique:toEntities(Child)`;
    const childrenThatAttendedSomething = await queryData(
      childrenThatAttendedSomethingQuery,
      moment().subtract(1, "week").toDate(),
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
      privateActivity,
    );
    await createNote(
      new Date(),
      [{ child: femaleNormalPresent, status: presentAttendanceStatus }],
      normalActivity,
    );

    const femaleParticipantsPrivateSchoolQuery = `
      School:toArray[*privateSchool=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipantsWithAttendance(PRESENT):unique
      :toEntities(Child):filterByObjectAttribute(gender, id, F)`;
    const femaleParticipantsInPrivateSchools = await queryData(
      femaleParticipantsPrivateSchoolQuery,
    );
    expectEntitiesToMatch(femaleParticipantsInPrivateSchools, [
      femalePrivatePresent,
    ]);

    const participantsNotPrivateSchoolQuery = `
      School:toArray[*privateSchool!=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipantsWithAttendance(PRESENT):unique
      :toEntities(Child)`;
    const participantsNotPrivateSchool = await queryData(
      participantsNotPrivateSchoolQuery,
    );
    expectEntitiesToMatch(participantsNotPrivateSchool, [femaleNormalPresent]);

    const attendedParticipantsQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT):unique
      :toEntities(Child)`;
    const attendedParticipants = await queryData(attendedParticipantsQuery);
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
    const schoolClassActivities = await queryData(schoolClassActivitiesQuery);
    expectEntitiesToMatch(schoolClassActivities, [schoolActivity]);

    const otherActivitiesQuery = `${RecurringActivity.ENTITY_TYPE}:toArray:filterByObjectAttribute(type, id, COACHING_CLASS)`;
    const otherActivities = await queryData(otherActivitiesQuery);
    expectEntitiesToMatch(otherActivities, [
      coachingActivity,
      coachingActivity2,
    ]);
  });

  it("should only load data for entities that are mentioned in query", async () => {
    const loadSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadSpy.and.resolveTo([]);

    await expectAsync(queryData("School:toArray")).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(entityRegistry.get("School"));
    expect(loadSpy).not.toHaveBeenCalledWith(entityRegistry.get("Child"));

    await expectAsync(queryData("Child:toArray")).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(entityRegistry.get("Child"));
  });

  it("should not load data for the same entity multiple times", async () => {
    const loadSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadSpy.and.resolveTo([]);

    await expectAsync(queryData("School:toArray")).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(entityRegistry.get("School"));
    loadSpy.calls.reset();

    await expectAsync(queryData("School:toArray")).toBeResolvedTo([]);
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("should load new data if the time-spans are non overlapping", async () => {
    const loadSpy = spyOn(
      TestBed.inject(ChildrenService),
      "getNotesInTimespan",
    );
    loadSpy.and.resolveTo([]);

    let from = moment().subtract(1, "week").toDate();
    let to = moment().toDate();
    const query = "Note:toArray[* date >= ? & date < ?]";
    await expectAsync(queryData(query, from, to)).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(from, to);
    loadSpy.calls.reset();

    to = moment().subtract(3, "days").toDate();
    await expectAsync(queryData(query, from, to)).toBeResolvedTo([]);
    expect(loadSpy).not.toHaveBeenCalled();

    from = moment().subtract(2, "weeks").toDate();
    await expectAsync(queryData(query, from, to)).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(from, to);
  });

  it("should load entities mentioned in functions", async () => {
    const loadSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadSpy.and.resolveTo([]);

    let query = "School:toArray:getRelated(ChildSchoolRelation, schoolId)";
    await expectAsync(queryData(query)).toBeResolvedTo([]);
    expect(loadSpy).toHaveBeenCalledWith(entityRegistry.get("School"));
    expect(loadSpy).toHaveBeenCalledWith(ChildSchoolRelation);
    loadSpy.calls.reset();

    query = "Child:toArray:getRelated(ChildSchoolRelation, childId)";
    await expectAsync(queryData(query)).toBeResolvedTo([]);
    expect(loadSpy).not.toHaveBeenCalledWith("School");
    expect(loadSpy).not.toHaveBeenCalledWith(ChildSchoolRelation);
    expect(loadSpy).toHaveBeenCalledWith(entityRegistry.get("Child"));
  });

  it("should load entities required in functions", async () => {
    const loadSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadSpy.and.resolveTo([]);
    const loadEventNotesSpy = spyOn(
      TestBed.inject(AttendanceService),
      "getEventsOnDate",
    ).and.resolveTo([]);

    const from = moment().subtract(1, "week").toDate();
    const to = new Date();
    const query = "EventNote:toArray:getAttendanceArray(true)";
    await expectAsync(queryData(query, from, to)).toBeResolvedTo([]);
    expect(loadEventNotesSpy).toHaveBeenCalledWith(from, to);
    expect(loadSpy).toHaveBeenCalledWith(ChildSchoolRelation);
  });

  it("should not load all data if a from date is provided", async () => {
    const oneWeekAgo = await createNote(moment().subtract(1, "week").toDate());
    const threeDaysAgo = await createNote(
      moment().subtract(3, "days").toDate(),
    );
    const today = await createNote(new Date());
    await createNote(moment().subtract(2, "week").toDate());

    const allEventsLastWeek: string[] = await queryData(
      `${EventNote.ENTITY_TYPE}:toArray.entityId`,
      moment().subtract(1, "week").toDate(),
    );
    expect(allEventsLastWeek).toEqual(
      jasmine.arrayWithExactContents([
        oneWeekAgo.getId(true),
        threeDaysAgo.getId(true),
        today.getId(true),
      ]),
    );
  });

  it("should not throw an error if dates are in the future", () => {
    const query = `${EventNote.ENTITY_TYPE}:toArray[* date >= ? & date < ?]`;
    const from = moment().add(1, "day").toDate();
    const to = moment().add(1, "week").toDate();
    return expectAsync(queryData(query, from, to)).toBeResolvedTo([]);
  });

  it("should load more events if a later date is provided", async () => {
    await createNote(moment().subtract(2, "week").toDate());
    const threeDaysAgo = await createNote(
      moment().subtract(3, "days").toDate(),
    );
    const today = await createNote(new Date());
    const allNotesQuery = `${EventNote.ENTITY_TYPE}:toArray`;

    const allNotesLastTwoDays = await queryData(
      allNotesQuery,
      moment().subtract(1, "days").toDate(),
    );

    expectEntitiesToMatch(allNotesLastTwoDays, [today]);

    const allNotesLastWeek = await queryData(
      allNotesQuery,
      moment().subtract(1, "week").toDate(),
    );

    expectEntitiesToMatch(allNotesLastWeek, [today, threeDaysAgo]);
  });

  it("should used updated entities if a new version has been saved", async () => {
    const child = await createChild("M");
    const query = "Child:toArray.gender.id";

    await expectAsync(queryData(query)).toBeResolvedTo(["M"]);

    child["gender"] = genders.find(({ id }) => id === "F");
    await entityMapper.save(child);

    await expectAsync(queryData(query)).toBeResolvedTo(["F"]);
  });

  it("should not count a deleted entity anymore", async () => {
    const child = await createChild("M");
    await createChild("F");
    const query = "Child:toArray.gender.id";

    await expectAsync(queryData(query)).toBeResolvedTo(
      jasmine.arrayWithExactContents(["M", "F"]),
    );

    await entityMapper.remove(child);
    // waiting for delete-update to be processed
    await new Promise((res) => setTimeout(res));

    await expectAsync(queryData(query)).toBeResolvedTo(["F"]);
  });

  it("should add notes to an array of event notes", async () => {
    const note1 = new Note();
    note1.date = new Date();
    await entityMapper.save(note1);
    const note2 = new Note();
    note2.date = new Date();
    await entityMapper.save(note2);
    const eventNote = await createNote(new Date(), []);

    const onlyEvents = await queryData(`${EventNote.ENTITY_TYPE}:toArray`);
    expectEntitiesToMatch(onlyEvents, [eventNote]);

    const eventsWithNotes = await queryData(
      `${EventNote.ENTITY_TYPE}:toArray:addEntities(${Note.ENTITY_TYPE})`,
    );

    expectEntitiesToMatch(eventsWithNotes, [note1, note2, eventNote]);
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
      activity,
    );
    await createNote(
      new Date(),
      [{ child: presentOnceWithoutSchool, status: absentAttendanceStatus }],
      activity,
    );
    await createNote(new Date(), [
      { child: alwaysAbsentWithSchool, status: absentAttendanceStatus },
      { child: presentTwiceWithSchool, status: presentAttendanceStatus },
    ]);

    const attendanceArrayQuery = `${EventNote.ENTITY_TYPE}:toArray:getAttendanceArray(true)`;

    const attendanceResult: AttendanceInfo =
      await queryData(attendanceArrayQuery);

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
    const lateAttendanceStatus = defaultAttendanceStatusTypes.find(
      (status) => status.id === "LATE",
    );
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
      { child: presentTwice, status: lateAttendanceStatus },
    ]);

    const reportQuery = `${EventNote.ENTITY_TYPE}:toArray:getAttendanceArray:getAttendanceReport`;

    const report: AttendanceReport[] = await queryData(reportQuery);

    expect(report).toContain({
      participant: presentTwice.getId(),
      present: 2,
      total: 2,
      percentage: "1.00",
      detailedStatus: { PRESENT: 1, LATE: 1 },
    });
    expect(report).toContain({
      participant: presentOnce.getId(),
      present: 1,
      total: 2,
      percentage: "0.50",
      detailedStatus: { PRESENT: 1, ABSENT: 1 },
    });
    expect(report).toContain({
      participant: alwaysAbsent.getId(),
      present: 0,
      total: 2,
      percentage: "0.00",
      detailedStatus: { ABSENT: 2 },
    });
  });

  it("should allow to set custom strings", async () => {
    await createChild();
    await createChild();

    const result = await queryData(`Child:toArray:setString(custom-string)`);

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

    const result = await queryData(
      `${EventNote.ENTITY_TYPE}:toArray:getIds(children):toEntities(Child).gender`,
    );

    expect(result).toEqual([maleChild["gender"]]);
  });

  it("does not throw an error if no query is provided", () => {
    return expectAsync(
      queryData(undefined, new Date(), new Date()),
    ).toBeResolvedTo({});
  });

  it("should support enum ids that contain spaces", async () => {
    const newGender = { id: "another gender", label: "some label" };
    genders.push(newGender);
    await createChild(newGender.id);
    await createChild("M");

    const res = await queryData(
      `Child:toArray:filterByObjectAttribute(gender, id, another gender):count`,
    );

    expect(res).toBe(1);
  });

  it("should allow to sum values", () => {
    const data = [
      { a: 1, b: 2 },
      { a: "4" }, // also allows strings
      { b: 5 }, // not existing as 0
      { a: -2 }, // allows negative
      { a: "three" }, // skips invalid
    ];

    const res = service.queryData("a:sum", undefined, undefined, data);

    expect(res).toBe(3);
  });

  it("should calculate the average of values", () => {
    const data = [
      { a: 5, b: 2 },
      { b: "11" },
      { b: -1 },
      { b: 100 },
      { a: "invalid" },
    ];

    let res = service.queryData("a:avg", undefined, undefined, data);
    expect(res).toBe("5");

    // Returns valid number if no values are available
    res = service.queryData("a:avg", undefined, undefined, [{ b: 1 }]);
    expect(res).toBe("0");

    // Numbers are fixed to provided decimals
    res = service.queryData("a:avg(2)", undefined, undefined, [
      { a: 3 },
      { a: 2 },
    ]);
    expect(res).toBe("2.50");

    // Handles 0 correctly
    res = service.queryData("a:avg", undefined, undefined, [{ a: 0 }]);
    expect(res).toBe("0");
  });

  function queryData(query: string, from?: Date, to?: Date, data?: any) {
    return service
      .cacheRequiredData(query, from, to)
      .then(() => service.queryData(query, from, to, data));
  }

  async function createChild(
    gender: "M" | "F" | string = "F",
    religion?: "muslim" | "christian",
  ): Promise<Entity> {
    const child = new (entityRegistry.get("Child"))();
    child["gender"] = genders.find((g) => g.id === gender);
    child["religion"] = religion;
    await entityMapper.save(child);
    return child;
  }

  async function createSchool(
    children: Entity[] = [],
    privateSchool?: boolean,
  ): Promise<Entity> {
    const school = new (entityRegistry.get("School"))();
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
    children: { child: Entity; status: AttendanceStatusType }[] = [],
    activity?: RecurringActivity,
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
    schools: Entity[],
    category = schoolClass,
  ): Promise<RecurringActivity> {
    const activity = new RecurringActivity();
    activity.linkedGroups = schools.map((s) => s.getId());
    activity.type = category;
    await entityMapper.save(activity);
    return activity;
  }
});
