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

  const loadTypeFake = (
    children: Child[] = [],
    schools: School[] = [],
    activities: RecurringActivity[] = [],
    eventNotes: EventNote[] = [],
    notes: Note[] = [],
    childSchoolRelations: ChildSchoolRelation[] = []
  ) => (entityClass) => {
    switch (entityClass as any) {
      case Child:
        return Promise.resolve(children);
      case School:
        return Promise.resolve(schools);
      case RecurringActivity:
        return Promise.resolve(activities);
      case EventNote:
        return Promise.resolve(eventNotes);
      case Note:
        return Promise.resolve(notes);
      case ChildSchoolRelation:
        return Promise.resolve(childSchoolRelations);
      default:
        return Promise.resolve([]);
    }
  };

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
    service = TestBed.inject(QueryService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return all children with specified attributes", async () => {
    const maleChristianChild = new Child();
    maleChristianChild.gender = Gender.MALE;
    maleChristianChild.religion = "christian";
    const femaleChristianChild = new Child();
    femaleChristianChild.gender = Gender.FEMALE;
    femaleChristianChild.religion = "christian";
    const femaleMuslimChild = new Child();
    femaleMuslimChild.gender = Gender.FEMALE;
    femaleMuslimChild.religion = "muslim";
    const maleChild = new Child();
    maleChild.gender = Gender.MALE;
    mockEntityMapper.loadType.and.resolveTo([
      maleChristianChild,
      femaleChristianChild,
      femaleMuslimChild,
      maleChild,
    ]);
    service.loadData();

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
    const femaleChild = new Child("femaleChild");
    femaleChild.gender = Gender.FEMALE;
    const maleChild = new Child("maleChild");
    maleChild.gender = Gender.MALE;

    const privateSchool = new School("privateSchool");
    privateSchool.privateSchool = true;
    const normalSchool = new School("normalSchool");

    const maleChildAttendsPrivateSchool = new ChildSchoolRelation(
      "maleChildAttendsPrivateSchool"
    );
    maleChildAttendsPrivateSchool.childId = maleChild.getId();
    maleChildAttendsPrivateSchool.schoolId = privateSchool.getId();
    maleChildAttendsPrivateSchool.start = moment()
      .subtract(1, "month")
      .toDate();

    const femaleChildAttendsNormalSchool = new ChildSchoolRelation(
      "femaleChildAttendsNormalSchool"
    );
    femaleChildAttendsNormalSchool.childId = femaleChild.getId();
    femaleChildAttendsNormalSchool.schoolId = normalSchool.getId();
    femaleChildAttendsNormalSchool.start = moment()
      .subtract(1, "week")
      .toDate();

    mockEntityMapper.loadType.and.callFake(
      loadTypeFake(
        [femaleChild, maleChild],
        [privateSchool, normalSchool],
        [],
        [],
        [],
        [maleChildAttendsPrivateSchool, femaleChildAttendsNormalSchool]
      )
    );
    service.loadData();

    const maleChildrenOnPrivateSchoolsQuery = `
      ${School.ENTITY_TYPE}:toArray
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
      jasmine.arrayWithExactContents([femaleChild, maleChild])
    );

    maleChildAttendsPrivateSchool.end = moment().subtract(1, "week").toDate();
    childrenVisitingAnySchool = await service.queryData(
      childrenVisitingAnySchoolQuery
    );
    expect(childrenVisitingAnySchool).toEqual([femaleChild]);
  });

  it("should return attended children in timespan", async () => {
    const maleChild = new Child("maleChild");
    maleChild.gender = Gender.MALE;
    const femaleChild1 = new Child("femaleChild1");
    femaleChild1.gender = Gender.FEMALE;
    const femaleChild2 = new Child("femaleChild2");
    femaleChild2.gender = Gender.FEMALE;

    const twoWeeksAgoPrivateEvent = new EventNote("twoWeeksAgoPrivateEvent");
    twoWeeksAgoPrivateEvent.date = moment().subtract(2, "weeks").toDate();
    twoWeeksAgoPrivateEvent.addChild(maleChild.getId());
    twoWeeksAgoPrivateEvent.addChild(femaleChild2.getId());

    const threeDaysAgoPrivateEvent = new EventNote("threeDaysAgoPrivateEvent");
    threeDaysAgoPrivateEvent.date = moment().subtract(3, "days").toDate();
    threeDaysAgoPrivateEvent.addChild(maleChild.getId());

    const sixDaysAgoNormalEvent = new EventNote("sixDaysAgoNormalEvent");
    sixDaysAgoNormalEvent.date = moment().subtract(6, "days").toDate();
    sixDaysAgoNormalEvent.addChild(femaleChild1.getId());

    const todayEventWithoutSchool = new EventNote("todayEventWithoutSchool");
    todayEventWithoutSchool.date = new Date();
    todayEventWithoutSchool.addChild(femaleChild1.getId());
    todayEventWithoutSchool.getAttendance(
      femaleChild1.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    todayEventWithoutSchool.addChild(maleChild.getId());
    todayEventWithoutSchool.getAttendance(
      maleChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );

    const twoDaysAgoEventWithoutRelation = new EventNote(
      "twoDaysAgoEventWithoutRelation"
    );
    twoDaysAgoEventWithoutRelation.date = moment().subtract(2, "days").toDate();
    twoDaysAgoEventWithoutRelation.addChild(femaleChild1.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChild1.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    twoDaysAgoEventWithoutRelation.addChild(femaleChild2.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChild2.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );

    mockEntityMapper.loadType.and.callFake(
      loadTypeFake(
        [maleChild, femaleChild2, femaleChild1],
        [],
        [],
        [
          threeDaysAgoPrivateEvent,
          twoWeeksAgoPrivateEvent,
          todayEventWithoutSchool,
          twoDaysAgoEventWithoutRelation,
          sixDaysAgoNormalEvent,
        ]
      )
    );
    service.loadData();

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
      jasmine.arrayWithExactContents([femaleChild1, femaleChild2])
    );
  });

  it("should count unique participants of events based on timespan, school and activity", async () => {
    const maleChild = new Child("maleChild");
    maleChild.gender = Gender.MALE;
    const femaleChild1 = new Child("femaleChild1");
    femaleChild1.gender = Gender.FEMALE;
    const femaleChild2 = new Child("femaleChild2");
    femaleChild2.gender = Gender.FEMALE;

    const privateSchool = new School("privateSchool");
    privateSchool.privateSchool = true;
    const normalSchool = new School("normalSchool");

    const privateActivity = new RecurringActivity("privateActivity");
    privateActivity.linkedGroups = [privateSchool.getId()];
    const normalActivity = new RecurringActivity("normalActivity");
    normalActivity.linkedGroups = [normalSchool.getId()];
    const activityWithoutLink = new RecurringActivity("activityWithoutLink");

    const twoWeeksAgoPrivateEvent = new EventNote("twoWeeksAgoPrivateEvent");
    twoWeeksAgoPrivateEvent.date = moment().subtract(2, "weeks").toDate();
    twoWeeksAgoPrivateEvent.relatesTo = privateActivity._id;
    twoWeeksAgoPrivateEvent.addChild(maleChild.getId());
    twoWeeksAgoPrivateEvent.addChild(femaleChild2.getId());

    const threeDaysAgoPrivateEvent = new EventNote("threeDaysAgoPrivateEvent");
    threeDaysAgoPrivateEvent.date = moment().subtract(3, "days").toDate();
    threeDaysAgoPrivateEvent.relatesTo = privateActivity._id;
    threeDaysAgoPrivateEvent.addChild(maleChild.getId());

    const sixDaysAgoNormalEvent = new EventNote("sixDaysAgoNormalEvent");
    sixDaysAgoNormalEvent.date = moment().subtract(6, "days").toDate();
    sixDaysAgoNormalEvent.relatesTo = normalActivity._id;
    sixDaysAgoNormalEvent.addChild(femaleChild1.getId());

    const todayEventWithoutSchool = new EventNote("todayEventWithoutSchool");
    todayEventWithoutSchool.date = new Date();
    todayEventWithoutSchool.relatesTo = activityWithoutLink._id;
    todayEventWithoutSchool.addChild(femaleChild1.getId());
    todayEventWithoutSchool.getAttendance(
      femaleChild1.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );
    todayEventWithoutSchool.addChild(maleChild.getId());
    todayEventWithoutSchool.getAttendance(
      maleChild.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );

    const twoDaysAgoEventWithoutRelation = new EventNote(
      "twoDaysAgoEventWithoutRelation"
    );
    twoDaysAgoEventWithoutRelation.date = moment().subtract(2, "days").toDate();
    twoDaysAgoEventWithoutRelation.addChild(femaleChild1.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChild1.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "ABSENT"
    );
    twoDaysAgoEventWithoutRelation.addChild(femaleChild2.getId());
    twoDaysAgoEventWithoutRelation.getAttendance(
      femaleChild2.getId()
    ).status = defaultAttendanceStatusTypes.find(
      (status) => status.countAs === "PRESENT"
    );

    mockEntityMapper.loadType.and.callFake(
      loadTypeFake(
        [femaleChild2, maleChild, femaleChild1],
        [privateSchool, normalSchool],
        [normalActivity, privateActivity, activityWithoutLink],
        [
          threeDaysAgoPrivateEvent,
          twoWeeksAgoPrivateEvent,
          twoDaysAgoEventWithoutRelation,
          todayEventWithoutSchool,
          sixDaysAgoNormalEvent,
        ]
      )
    );
    service.loadData();

    const femaleParticipantsPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities[*gender=${Gender.FEMALE}]`;
    const femaleParticipantsInPrivateSchools = await service.queryData(
      femaleParticipantsPrivateSchoolQuery
    );
    expect(femaleParticipantsInPrivateSchools).toEqual([femaleChild2]);

    const participantsNotPrivateSchoolQuery = `
      ${School.ENTITY_TYPE}:toArray[*privateSchool!=true]
      :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
      :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
      :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const participantsNotPrivateSchool = await service.queryData(
      participantsNotPrivateSchoolQuery
    );
    expect(participantsNotPrivateSchool).toEqual([femaleChild1]);

    const attendedParticipantsQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
      :toEntities`;
    const attendedParticipants = await service.queryData(
      attendedParticipantsQuery
    );
    expect(attendedParticipants).toEqual(
      jasmine.arrayWithExactContents([femaleChild1, femaleChild2])
    );
  });
});
