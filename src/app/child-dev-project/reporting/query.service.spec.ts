import { TestBed } from "@angular/core/testing";

import { QueryService } from "./query.service";
import { Child } from "../children/model/child";
import { Gender } from "../children/model/Gender";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { School } from "../schools/model/school";
import { RecurringActivity } from "../attendance/model/recurring-activity";
import { EventNote } from "../attendance/model/event-note";
import { Note } from "../notes/model/note";
import moment from "moment";
import { defaultAttendanceStatusTypes } from "../../core/config/default-config/default-attendance-status-types";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";

describe("QueryService", () => {
  let service: QueryService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  let maleChristianChild: Child;
  let femaleChristianChild: Child;
  let femaleMuslimChild: Child;
  let maleChild: Child;

  let privateSchool: School;
  let normalSchool: School;

  let maleChildAttendsPrivateSchool: ChildSchoolRelation;
  let maleChristianChildAttendsNormalSchool: ChildSchoolRelation;
  let femaleChristianChildAttendsNormalSchool: ChildSchoolRelation;

  let privateActivity: RecurringActivity;
  let normalActivity: RecurringActivity;
  let activityWithoutLink: RecurringActivity;

  let twoWeeksAgoPrivateEvent: EventNote;
  let threeDaysAgoPrivateEvent: EventNote;
  let sixDaysAgoNormalEvent: EventNote;
  let todayEventWithoutSchool: EventNote;
  let twoDaysAgoEventWithoutRelation: EventNote;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
    service = TestBed.inject(QueryService);
  });

  beforeEach(() => {
    maleChristianChild = new Child("maleChristianChild");
    maleChristianChild.gender = Gender.MALE;
    maleChristianChild.religion = "christian";
    femaleChristianChild = new Child("femaleChristianChild");
    femaleChristianChild.gender = Gender.FEMALE;
    femaleChristianChild.religion = "christian";
    femaleMuslimChild = new Child("femaleMuslimChild");
    femaleMuslimChild.gender = Gender.FEMALE;
    femaleMuslimChild.religion = "muslim";
    maleChild = new Child("maleChild");
    maleChild.gender = Gender.MALE;

    privateSchool = new School("privateSchool");
    privateSchool.privateSchool = true;
    normalSchool = new School("normalSchool");

    maleChildAttendsPrivateSchool = new ChildSchoolRelation(
      "maleChildAttendsPrivateSchool"
    );
    maleChildAttendsPrivateSchool.childId = maleChild.getId();
    maleChildAttendsPrivateSchool.schoolId = privateSchool.getId();
    maleChildAttendsPrivateSchool.start = moment()
      .subtract(1, "month")
      .toDate();
    maleChristianChildAttendsNormalSchool = new ChildSchoolRelation(
      "maleChristianChildAttendsPrivateSchool"
    );
    maleChristianChildAttendsNormalSchool.childId = maleChristianChild.getId();
    maleChristianChildAttendsNormalSchool.schoolId = normalSchool.getId();
    maleChristianChildAttendsNormalSchool.start = moment()
      .subtract(1, "week")
      .toDate();

    femaleChristianChildAttendsNormalSchool = new ChildSchoolRelation(
      "femaleChristianChildAttendsNormalSchool"
    );
    femaleChristianChildAttendsNormalSchool.childId = femaleChristianChild.getId();
    femaleChristianChildAttendsNormalSchool.schoolId = normalSchool.getId();
    femaleChristianChildAttendsNormalSchool.start = moment()
      .subtract(1, "week")
      .toDate();

    privateActivity = new RecurringActivity("privateActivity");
    privateActivity.linkedGroups = [privateSchool.getId()];
    normalActivity = new RecurringActivity("normalActivity");
    normalActivity.linkedGroups = [normalSchool.getId()];
    activityWithoutLink = new RecurringActivity("activityWithoutLink");

    twoWeeksAgoPrivateEvent = new EventNote("twoWeeksAgoPrivateEvent");
    twoWeeksAgoPrivateEvent.date = moment().subtract(2, "weeks").toDate();
    twoWeeksAgoPrivateEvent.relatesTo = privateActivity._id;
    twoWeeksAgoPrivateEvent.addChild(maleChild.getId());
    twoWeeksAgoPrivateEvent.addChild(femaleChristianChild.getId());

    threeDaysAgoPrivateEvent = new EventNote("threeDaysAgoPrivateEvent");
    threeDaysAgoPrivateEvent.date = moment().subtract(3, "days").toDate();
    threeDaysAgoPrivateEvent.relatesTo = privateActivity._id;
    threeDaysAgoPrivateEvent.addChild(maleChild.getId());

    sixDaysAgoNormalEvent = new EventNote("sixDaysAgoNormalEvent");
    sixDaysAgoNormalEvent.date = moment().subtract(6, "days").toDate();
    sixDaysAgoNormalEvent.relatesTo = normalActivity._id;
    sixDaysAgoNormalEvent.addChild(femaleMuslimChild.getId());

    todayEventWithoutSchool = new EventNote("todayEventWithoutSchool");
    todayEventWithoutSchool.date = new Date();
    todayEventWithoutSchool.relatesTo = activityWithoutLink._id;
    todayEventWithoutSchool.addChild(femaleChristianChild.getId());
    todayEventWithoutSchool.getAttendance(
      femaleChristianChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    todayEventWithoutSchool.addChild(maleChild.getId());
    todayEventWithoutSchool.getAttendance(
      maleChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );

    twoDaysAgoEventWithoutRelation = new EventNote(
      "twoDaysAgoEventWithoutRelation"
    );
    twoDaysAgoEventWithoutRelation.date = moment().subtract(2, "days").toDate();
    twoDaysAgoEventWithoutRelation.addChild(femaleChristianChild.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChristianChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );
    twoDaysAgoEventWithoutRelation.addChild(maleChristianChild.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      maleChristianChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    mockEntityMapper.loadType.and.callFake((entityClass) => {
      switch (entityClass as any) {
        case Child:
          return Promise.resolve([
            femaleMuslimChild,
            femaleChristianChild,
            maleChristianChild,
            maleChild,
          ]);
        case School:
          return Promise.resolve([privateSchool, normalSchool]);
        case RecurringActivity:
          return Promise.resolve([
            normalActivity,
            privateActivity,
            activityWithoutLink,
          ]);
        case EventNote:
          return Promise.resolve([
            threeDaysAgoPrivateEvent,
            twoWeeksAgoPrivateEvent,
            twoDaysAgoEventWithoutRelation,
            todayEventWithoutSchool,
            sixDaysAgoNormalEvent,
          ]);
        case ChildSchoolRelation:
          return Promise.resolve([
            maleChildAttendsPrivateSchool,
            femaleChristianChildAttendsNormalSchool,
            maleChristianChildAttendsNormalSchool,
          ]);
        default:
          return Promise.resolve([]);
      }
    });
    service.loadData();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return all children with specified attributes", async () => {
    const maleChristianQuery = `${Child.ENTITY_TYPE}:toArray[*gender=M & religion=christian]`;
    const maleChristians = await service.queryData(maleChristianQuery);
    expect(maleChristians).toEqual([maleChristianChild]);

    const femaleQuery = `${Child.ENTITY_TYPE}:toArray[*gender=F]`;
    const females = await service.queryData(femaleQuery);
    expect(females).toEqual(
      jasmine.arrayWithExactContents([femaleChristianChild, femaleMuslimChild])
    );

    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expect(allChildren).toEqual(
      jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChild,
        femaleChristianChild,
        femaleMuslimChild,
      ])
    );
  });

  it("should return all children attending a school based on attributes", async () => {
    const maleChildrenOnPrivateSchoolsQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      :getActive.childId:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities[*gender=${Gender.MALE}]`;

    const maleChildrenOnPrivateSchools = await service.queryData(
      maleChildrenOnPrivateSchoolsQuery
    );
    expect(maleChildrenOnPrivateSchools).toEqual([maleChild]);

    const childrenVisitingAnySchoolQuery = `
      ${School.ENTITY_TYPE}:toArray
      :getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)
      :getActive.childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    let childrenVisitingAnySchool = await service.queryData(
      childrenVisitingAnySchoolQuery
    );
    expect(childrenVisitingAnySchool).toEqual(
      jasmine.arrayWithExactContents([
        femaleChristianChild,
        maleChild,
        maleChristianChild,
      ])
    );

    maleChildAttendsPrivateSchool.end = moment().subtract(1, "week").toDate();
    childrenVisitingAnySchool = await service.queryData(
      childrenVisitingAnySchoolQuery
    );
    console.log(
      "childern",
      childrenVisitingAnySchool,
      maleChildAttendsPrivateSchool,
      maleChristianChildAttendsNormalSchool,
      femaleChristianChildAttendsNormalSchool
    );
    expect(childrenVisitingAnySchool).toEqual(
      jasmine.arrayWithExactContents([maleChristianChild, femaleChristianChild])
    );
  });

  it("should allow to query data multiple times", async () => {
    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expect(allChildren).toEqual(
      jasmine.arrayWithExactContents([
        maleChristianChild,
        femaleChristianChild,
        femaleMuslimChild,
        maleChild,
      ])
    );

    const maleChildrenCountQuery = `[*gender=${Gender.MALE}]:count`;
    const maleChildrenCount = await service.queryData(
      maleChildrenCountQuery,
      allChildren
    );
    expect(maleChildrenCount).toBe(2);

    const christianCountQuery = `[*religion=christian]:count`;
    const christianCount = await service.queryData(
      christianCountQuery,
      allChildren
    );
    expect(christianCount).toBe(2);

    const maleChristiansCountQuery = `[*gender=${Gender.MALE} & religion=christian]:count`;
    const maleChristiansCount = await service.queryData(
      maleChristiansCountQuery,
      allChildren
    );
    expect(maleChristiansCount).toBe(1);
  });

  it("should return attended children in timespan", async () => {
    const eventsLastWeekQuery = [
      `${EventNote.ENTITY_TYPE}:toArray[*date > ?]`,
      moment().subtract(1, "week").toDate(),
    ];
    const eventsLastWeek = await service.queryData(eventsLastWeekQuery);
    expect(eventsLastWeek).toEqual(
      jasmine.arrayWithExactContents([
        threeDaysAgoPrivateEvent,
        todayEventWithoutSchool,
        twoDaysAgoEventWithoutRelation,
        sixDaysAgoNormalEvent,
      ])
    );

    const childrenThatAttendedSomethingQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT)
      :addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenThatAttendedSomething = await service.queryData(
      childrenThatAttendedSomethingQuery
    );
    expect(childrenThatAttendedSomething).toEqual(
      jasmine.arrayWithExactContents([femaleChristianChild, maleChristianChild])
    );
  });

  it("should count unique participants of events based on timespan, school and activity", async () => {
    const femaleParticipantsPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities[*gender=${Gender.FEMALE}]`;
    const femaleParticipantsInPrivateSchools = await service.queryData(
      femaleParticipantsPrivateSchoolQuery
    );
    expect(femaleParticipantsInPrivateSchools).toEqual([femaleChristianChild]);

    const participantsNotPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool!=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const participantsNotPrivateSchool = await service.queryData(
      participantsNotPrivateSchoolQuery
    );
    expect(participantsNotPrivateSchool).toEqual([femaleMuslimChild]);

    const attendedParticipantsQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const attendedParticipants = await service.queryData(
      attendedParticipantsQuery
    );
    expect(attendedParticipants).toEqual(
      jasmine.arrayWithExactContents([maleChristianChild, femaleChristianChild])
    );
  });
});
