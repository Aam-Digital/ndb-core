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

describe("QueryService", () => {
  let service: QueryService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  const loadTypeFake = (
    children: Child[] = [],
    schools: School[] = [],
    activities: RecurringActivity[] = [],
    eventNotes: EventNote[] = [],
    notes: Note[] = []
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

  it("should count all children with specified attributes", async () => {
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
    expect(maleChristians).toHaveSize(1);

    const femaleQuery = `${Child.ENTITY_TYPE}:toArray[*gender=F]`;
    const females = await service.queryData(femaleQuery);
    expect(females).toHaveSize(2);

    const allChildren = await service.queryData(`${Child.ENTITY_TYPE}:toArray`);
    expect(allChildren).toHaveSize(4);
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

    const lastWeekRelationsQuery = [
      `${EventNote.ENTITY_TYPE}:toArray[*date > ?]`,
      moment().subtract(1, "week").toDate(),
    ];
    const lastWeekRelations = await service.queryData(lastWeekRelationsQuery);
    expect(lastWeekRelations).toHaveSize(4);

    const childrenThatAttendedSomethingQuery = `
      ${EventNote.ENTITY_TYPE}:toArray
      :getParticipantsWithAttendance(PRESENT)
      :addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`;
    const childrenThatAttendedSomething = await service.queryData(
      childrenThatAttendedSomethingQuery
    );
    expect(childrenThatAttendedSomething).toHaveSize(2);
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

    const femaleParticipantsPrivateSchoolLastMonthQuery = [
      `${School.ENTITY_TYPE}:toArray[*privateSchool=true]
        :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
        :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
        :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
        :toEntities[*gender=${Gender.FEMALE}]`,
      moment().subtract(1, "month").toDate(),
    ];
    const femaleParticipantsLastMonthInPrivateSchools = await service.queryData(
      femaleParticipantsPrivateSchoolLastMonthQuery
    );
    expect(femaleParticipantsLastMonthInPrivateSchools).toHaveSize(1);

    const participantsLastWeekNotPrivateSchoolQuery = [
      `${School.ENTITY_TYPE}:toArray[*privateSchool!=true]
        :getRelated(${RecurringActivity.ENTITY_TYPE}, linkedGroups)
        :getRelated(${EventNote.ENTITY_TYPE}, relatesTo)
        :getParticipants:addPrefix(${Child.ENTITY_TYPE}):unique
        :toEntities`,
      moment().subtract(1, "week").toDate(),
    ];
    const participantsLastWeekNotPrivateSchool = await service.queryData(
      participantsLastWeekNotPrivateSchoolQuery
    );
    expect(participantsLastWeekNotPrivateSchool).toHaveSize(1);

    const attendedParticipantsLastMonthQuery = [
      `${EventNote.ENTITY_TYPE}:toArray
        :getParticipantsWithAttendance(PRESENT):addPrefix(${Child.ENTITY_TYPE}):unique
        :toEntities`,
      moment().subtract(1, "month").toDate(),
    ];
    const attendedParticipantsLastMonth = await service.queryData(
      attendedParticipantsLastMonthQuery
    );
    expect(attendedParticipantsLastMonth).toHaveSize(2);
  });
});
