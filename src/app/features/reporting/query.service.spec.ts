import { TestBed } from "@angular/core/testing";

import { QueryService } from "./query.service";
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
import { PouchDatabase } from "../../core/database/pouch-database";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { Database } from "../../core/database/database";
import { ConfigurableEnumModule } from "../../core/configurable-enum/configurable-enum.module";
import { Note } from "../../child-dev-project/notes/model/note";
import { genders } from "../../child-dev-project/children/model/genders";

describe("QueryService", () => {
  let service: QueryService;
  let database: PouchDatabase;

  let maleChristianChild: Child;
  let femaleChristianChild: Child;
  let femaleMuslimChild: Child;
  let maleChild: Child;

  let privateSchool: School;
  let normalSchool: School;

  let maleChildAttendsPrivateSchool: ChildSchoolRelation;
  let maleChristianChildAttendsNormalSchool: ChildSchoolRelation;
  let femaleChristianChildAttendsNormalSchool: ChildSchoolRelation;

  let privateSchoolClassActivity: RecurringActivity;
  let normalLifeSkillsActivity: RecurringActivity;
  let lifeSkillsActivityWithoutLink: RecurringActivity;

  let twoWeeksAgoPrivateEvent: EventNote;
  let threeDaysAgoPrivateEvent: EventNote;
  let sixDaysAgoNormalEvent: EventNote;
  let todayEventWithoutSchool: EventNote;
  let twoDaysAgoEventWithoutRelation: EventNote;

  beforeEach(() => {
    database = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      imports: [ConfigurableEnumModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        AttendanceService,
        DatabaseIndexingService,
        { provide: Database, useValue: database },
      ],
    });
    service = TestBed.inject(QueryService);
  });

  beforeEach(async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    maleChristianChild = new Child("maleChristianChild");
    maleChristianChild.gender = genders[1];
    maleChristianChild.religion = "christian";
    await entityMapper.save(maleChristianChild);
    femaleChristianChild = new Child("femaleChristianChild");
    femaleChristianChild.gender = genders[2];
    femaleChristianChild.religion = "christian";
    await entityMapper.save(femaleChristianChild);
    femaleMuslimChild = new Child("femaleMuslimChild");
    femaleMuslimChild.gender = genders[2];
    femaleMuslimChild.religion = "muslim";
    await entityMapper.save(femaleMuslimChild);
    maleChild = new Child("maleChild");
    maleChild.gender = genders[1];
    await entityMapper.save(maleChild);

    privateSchool = new School("privateSchool");
    privateSchool.privateSchool = true;
    await entityMapper.save(privateSchool);
    normalSchool = new School("normalSchool");
    await entityMapper.save(normalSchool);

    maleChildAttendsPrivateSchool = new ChildSchoolRelation(
      "maleChildAttendsPrivateSchool"
    );
    maleChildAttendsPrivateSchool.childId = maleChild.getId();
    maleChildAttendsPrivateSchool.schoolId = privateSchool.getId();
    maleChildAttendsPrivateSchool.start = moment()
      .subtract(1, "month")
      .toDate();
    await entityMapper.save(maleChildAttendsPrivateSchool);

    maleChristianChildAttendsNormalSchool = new ChildSchoolRelation(
      "maleChristianChildAttendsPrivateSchool"
    );
    maleChristianChildAttendsNormalSchool.childId = maleChristianChild.getId();
    maleChristianChildAttendsNormalSchool.schoolId = normalSchool.getId();
    maleChristianChildAttendsNormalSchool.start = moment()
      .subtract(1, "week")
      .toDate();
    await entityMapper.save(maleChristianChildAttendsNormalSchool);

    femaleChristianChildAttendsNormalSchool = new ChildSchoolRelation(
      "femaleChristianChildAttendsNormalSchool"
    );
    femaleChristianChildAttendsNormalSchool.childId =
      femaleChristianChild.getId();
    femaleChristianChildAttendsNormalSchool.schoolId = normalSchool.getId();
    femaleChristianChildAttendsNormalSchool.start = moment()
      .subtract(1, "week")
      .toDate();
    await entityMapper.save(femaleChristianChildAttendsNormalSchool);

    const schoolClass = defaultInteractionTypes.find(
      (i) => i.id === "SCHOOL_CLASS"
    );
    const lifeSkills = defaultInteractionTypes.find(
      (i) => i.id === "LIFE_SKILLS"
    );
    privateSchoolClassActivity = new RecurringActivity(
      "privateSchoolClassActivity"
    );
    privateSchoolClassActivity.linkedGroups = [privateSchool.getId()];
    privateSchoolClassActivity.type = schoolClass;
    await entityMapper.save(privateSchoolClassActivity);
    normalLifeSkillsActivity = new RecurringActivity(
      "normalLifeSkillsActivity"
    );
    normalLifeSkillsActivity.linkedGroups = [normalSchool.getId()];
    normalLifeSkillsActivity.type = lifeSkills;
    await entityMapper.save(normalLifeSkillsActivity);
    lifeSkillsActivityWithoutLink = new RecurringActivity(
      "lifeSkillsActivityWithoutLink"
    );
    lifeSkillsActivityWithoutLink.type = lifeSkills;
    await entityMapper.save(lifeSkillsActivityWithoutLink);

    const presentAttendanceStatus = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    const absentAttendanceStatus = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );

    twoWeeksAgoPrivateEvent = new EventNote("twoWeeksAgoPrivateEvent");
    twoWeeksAgoPrivateEvent.date = moment().subtract(2, "weeks").toDate();
    twoWeeksAgoPrivateEvent.relatesTo = privateSchoolClassActivity._id;
    twoWeeksAgoPrivateEvent.category = schoolClass;
    twoWeeksAgoPrivateEvent.addChild(maleChild.getId());
    twoWeeksAgoPrivateEvent.getAttendance(maleChild.getId()).status =
      absentAttendanceStatus;
    twoWeeksAgoPrivateEvent.addChild(femaleChristianChild.getId());
    twoWeeksAgoPrivateEvent.getAttendance(femaleChristianChild.getId()).status =
      presentAttendanceStatus;
    await entityMapper.save(twoWeeksAgoPrivateEvent);

    threeDaysAgoPrivateEvent = new EventNote("threeDaysAgoPrivateEvent");
    threeDaysAgoPrivateEvent.date = moment().subtract(3, "days").toDate();
    threeDaysAgoPrivateEvent.relatesTo = privateSchoolClassActivity._id;
    threeDaysAgoPrivateEvent.category = schoolClass;
    threeDaysAgoPrivateEvent.addChild(maleChild.getId());
    threeDaysAgoPrivateEvent.getAttendance(maleChild.getId()).status =
      absentAttendanceStatus;
    await entityMapper.save(threeDaysAgoPrivateEvent);

    sixDaysAgoNormalEvent = new EventNote("sixDaysAgoNormalEvent");
    sixDaysAgoNormalEvent.date = moment().subtract(6, "days").toDate();
    sixDaysAgoNormalEvent.relatesTo = normalLifeSkillsActivity._id;
    sixDaysAgoNormalEvent.category = lifeSkills;
    sixDaysAgoNormalEvent.addChild(femaleMuslimChild.getId());
    sixDaysAgoNormalEvent.getAttendance(femaleMuslimChild.getId()).status =
      presentAttendanceStatus;
    await entityMapper.save(sixDaysAgoNormalEvent);

    todayEventWithoutSchool = new EventNote("todayEventWithoutSchool");
    todayEventWithoutSchool.date = new Date();
    todayEventWithoutSchool.relatesTo = lifeSkillsActivityWithoutLink._id;
    todayEventWithoutSchool.category = lifeSkills;
    todayEventWithoutSchool.addChild(femaleChristianChild.getId());
    todayEventWithoutSchool.getAttendance(femaleChristianChild.getId()).status =
      presentAttendanceStatus;
    todayEventWithoutSchool.addChild(maleChild.getId());
    todayEventWithoutSchool.getAttendance(maleChild.getId()).status =
      absentAttendanceStatus;
    await entityMapper.save(todayEventWithoutSchool);

    twoDaysAgoEventWithoutRelation = new EventNote(
      "twoDaysAgoEventWithoutRelation"
    );
    twoDaysAgoEventWithoutRelation.date = moment().subtract(2, "days").toDate();
    twoDaysAgoEventWithoutRelation.category = schoolClass;
    twoDaysAgoEventWithoutRelation.addChild(femaleChristianChild.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChristianChild.getId()
    ).status = absentAttendanceStatus;
    twoDaysAgoEventWithoutRelation.addChild(maleChristianChild.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      maleChristianChild.getId()
    ).status = presentAttendanceStatus;
    await entityMapper.save(twoDaysAgoEventWithoutRelation);
  });

  afterEach(async () => {
    await database.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return all children with specified attributes", async () => {
    const maleChristianQuery = `${Child.ENTITY_TYPE}:toArray:filterByObjectAttribute(gender, id, M)[*religion=christian]`;
    const maleChristians = await service.queryData(maleChristianQuery);
    expectEntitiesToMatch(maleChristians, [maleChristianChild]);

    const femaleQuery = `${Child.ENTITY_TYPE}:toArray:filterByObjectAttribute(gender, id, F)`;
    const females = await service.queryData(femaleQuery);
    expectEntitiesToMatch(females, [femaleChristianChild, femaleMuslimChild]);

    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expectEntitiesToMatch(allChildren, [
      maleChristianChild,
      maleChild,
      femaleChristianChild,
      femaleMuslimChild,
    ]);
  });

  it("should return all children attending a school based on attributes", async () => {
    const maleChildrenOnPrivateSchoolsQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities:filterByObjectAttribute(gender, id, M)`;

    const maleChildrenOnPrivateSchools = await service.queryData(
      maleChildrenOnPrivateSchoolsQuery
    );
    expectEntitiesToMatch(maleChildrenOnPrivateSchools, [maleChild]);

    const childrenVisitingAnySchoolQuery = `
      ${School.ENTITY_TYPE}:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      [*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenVisitingAnySchool = await service.queryData(
      childrenVisitingAnySchoolQuery
    );
    expectEntitiesToMatch(childrenVisitingAnySchool, [
      femaleChristianChild,
      maleChild,
      maleChristianChild,
    ]);
  });

  it("should allow to query data multiple times", async () => {
    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expectEntitiesToMatch(allChildren, [
      maleChristianChild,
      femaleChristianChild,
      femaleMuslimChild,
      maleChild,
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
    const eventsLastWeekQuery = `${EventNote.ENTITY_TYPE}:toArray[*date > ?]`;
    const eventsLastWeek = await service.queryData(
      eventsLastWeekQuery,
      moment().subtract(1, "week").toDate()
    );
    expectEntitiesToMatch(eventsLastWeek, [
      threeDaysAgoPrivateEvent,
      todayEventWithoutSchool,
      twoDaysAgoEventWithoutRelation,
      sixDaysAgoNormalEvent,
    ]);

    const childrenThatAttendedSomethingQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT)
      :addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenThatAttendedSomething = await service.queryData(
      childrenThatAttendedSomethingQuery
    );
    expectEntitiesToMatch(childrenThatAttendedSomething, [
      femaleChristianChild,
      maleChristianChild,
      femaleMuslimChild,
    ]);
  });

  it("should count unique participants of events based on school and activity", async () => {
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
      femaleChristianChild,
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
    expectEntitiesToMatch(participantsNotPrivateSchool, [femaleMuslimChild]);

    const attendedParticipantsQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const attendedParticipants = await service.queryData(
      attendedParticipantsQuery
    );
    expectEntitiesToMatch(attendedParticipants, [
      maleChristianChild,
      femaleChristianChild,
      femaleMuslimChild,
    ]);
  });

  it("should allow queries on complex attributes", async () => {
    const schoolClassActivitiesQuery = `${RecurringActivity.ENTITY_TYPE}:toArray:filterByObjectAttribute(type, id, SCHOOL_CLASS)`;
    const schoolClassActivities = await service.queryData(
      schoolClassActivitiesQuery
    );
    expectEntitiesToMatch(schoolClassActivities, [privateSchoolClassActivity]);

    const otherActivitiesQuery = `${RecurringActivity.ENTITY_TYPE}:toArray:filterByObjectAttribute(type, id, LIFE_SKILLS)`;
    const otherActivities = await service.queryData(otherActivitiesQuery);
    expectEntitiesToMatch(otherActivities, [
      lifeSkillsActivityWithoutLink,
      normalLifeSkillsActivity,
    ]);
  });

  it("should not load all data if a from date is provided", async () => {
    const eventsQuery = `${EventNote.ENTITY_TYPE}:toArray`;
    const date = moment().subtract(1, "week").toDate();

    const allEventsLastWeek = await service.queryData(eventsQuery, date);
    expectEntitiesToMatch(allEventsLastWeek, [
      threeDaysAgoPrivateEvent,
      sixDaysAgoNormalEvent,
      todayEventWithoutSchool,
      twoDaysAgoEventWithoutRelation,
    ]);
  });

  it("should load more notes if a later date is provided", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const yesterdayNote = new Note("yesterdayNote");
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    await entityMapper.save(yesterdayNote);
    const sixDaysAgoNote = new Note("sixDaysAgoNote");
    sixDaysAgoNote.date = moment().subtract(6, "days").toDate();
    await entityMapper.save(sixDaysAgoNote);
    const allNotesQuery = `${Note.ENTITY_TYPE}:toArray`;

    const allNotesLastTwoDays = await service.queryData(
      allNotesQuery,
      moment().subtract(2, "days").toDate()
    );

    expectEntitiesToMatch(allNotesLastTwoDays, [yesterdayNote]);

    const allNotesLastWeek = await service.queryData(
      allNotesQuery,
      moment().subtract(1, "week").toDate()
    );

    expectEntitiesToMatch(allNotesLastWeek, [yesterdayNote, sixDaysAgoNote]);
  });

  it("should add notes to an array of event notes", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const note1 = new Note();
    note1.children = [femaleMuslimChild.getId()];
    note1.date = new Date();
    await entityMapper.save(note1);
    const note2 = new Note();
    note2.children = [maleChild.getId()];
    note2.date = new Date();
    await entityMapper.save(note2);
    const onlyEvents = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray`
    );

    const eventsWithNotes = await service.queryData(
      `${EventNote.ENTITY_TYPE}:toArray:addEntities(${Note.ENTITY_TYPE})`
    );

    expect(eventsWithNotes.length).toBe(onlyEvents.length + 2);
    expect(eventsWithNotes).toContain(note1);
    expect(eventsWithNotes).toContain(note2);
  });
});
