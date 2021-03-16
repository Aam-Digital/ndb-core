import { TestBed } from "@angular/core/testing";

import { AggregationService } from "./aggregation.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Child } from "../children/model/child";
import { Gender } from "../children/model/Gender";
import { School } from "../schools/model/school";
import { RecurringActivity } from "../attendance/model/recurring-activity";
import { EventNote } from "../attendance/model/event-note";
import { Note } from "../notes/model/note";
import moment from "moment";

describe("AggregationService", () => {
  let service: AggregationService;
  const mockEntityMapper: jasmine.SpyObj<EntityMapperService> = jasmine.createSpyObj(
    ["loadType"]
  );

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
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
    service = TestBed.inject(AggregationService);
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

    const maleChristianQuery = {
      gender: "M",
      religion: "christian",
    };
    const maleChristians = await service.countEntitiesByProperties(
      Child,
      maleChristianQuery
    );
    expect(maleChristians).toEqual(1);

    const femaleQuery = {
      gender: "F",
    };
    const females = await service.countEntitiesByProperties(Child, femaleQuery);
    expect(females).toEqual(2);

    const allChildren = await service.countEntitiesByProperties(Child, {});
    expect(allChildren).toEqual(4);
  });

  it("should count events based on properties of a linked school for a timespan", async () => {
    const privateSchool1 = new School();
    privateSchool1.privateSchool = true;
    const privateSchool2 = new School();
    privateSchool2.privateSchool = true;
    const stateSchool = new School();
    stateSchool.privateSchool = false;
    const otherSchool = new School();
    const privateSchool3 = new School();
    privateSchool3.privateSchool = true;

    const privateActivity1 = new RecurringActivity();
    privateActivity1.linkedGroups = [privateSchool1.getId()];
    const privateActivity2 = new RecurringActivity();
    privateActivity2.linkedGroups = [privateSchool2.getId()];
    const stateActivity = new RecurringActivity();
    stateActivity.linkedGroups = [stateSchool.getId()];
    const otherActivity = new RecurringActivity();
    otherActivity.linkedGroups = [otherSchool.getId()];
    const activityWithoutLink = new RecurringActivity();

    const twoMonthsAgoPrivateEvent = new EventNote();
    twoMonthsAgoPrivateEvent.relatesTo = privateActivity1._id;
    twoMonthsAgoPrivateEvent.date = moment().subtract(2, "months").toDate();
    const nineDaysAgoPrivateEvent = new EventNote();
    nineDaysAgoPrivateEvent.relatesTo = privateActivity1._id;
    nineDaysAgoPrivateEvent.date = moment().subtract(9, "days").toDate();
    const oneWeekAgoPrivateEvent = new EventNote();
    oneWeekAgoPrivateEvent.relatesTo = privateActivity2._id;
    oneWeekAgoPrivateEvent.date = moment().subtract(1, "week").toDate();
    const fourDaysAgoOtherEvent = new EventNote();
    fourDaysAgoOtherEvent.relatesTo = otherActivity._id;
    fourDaysAgoOtherEvent.date = moment().subtract(4, "days").toDate();
    const twoWeeksAgoOtherEvent = new EventNote();
    twoWeeksAgoOtherEvent.relatesTo = otherActivity._id;
    twoWeeksAgoOtherEvent.date = moment().subtract(2, "weeks").toDate();
    const todayStateEvent = new EventNote();
    todayStateEvent.relatesTo = stateActivity._id;
    todayStateEvent.date = new Date();
    const twoDaysAgoWithoutSchoolEvent = new EventNote();
    twoDaysAgoWithoutSchoolEvent.relatesTo = activityWithoutLink._id;
    twoDaysAgoWithoutSchoolEvent.date = moment().subtract(2, "days").toDate();
    const todayUnrelatedEvent = new EventNote();
    todayUnrelatedEvent.date = new Date();

    mockEntityMapper.loadType.and.callFake(
      loadTypeFake(
        [],
        [
          privateSchool1,
          privateSchool3,
          privateSchool2,
          stateSchool,
          otherSchool,
        ],
        [
          stateActivity,
          privateActivity2,
          activityWithoutLink,
          otherActivity,
          privateActivity1,
        ],
        [
          nineDaysAgoPrivateEvent,
          todayStateEvent,
          twoMonthsAgoPrivateEvent,
          oneWeekAgoPrivateEvent,
          fourDaysAgoOtherEvent,
          todayUnrelatedEvent,
          twoDaysAgoWithoutSchoolEvent,
          twoWeeksAgoOtherEvent,
        ]
      )
    );
    service.loadData();

    const privateSchoolsLastMonthQuery = {
      date: { gte: moment().subtract(1, "month").toDate() },
      RecurringActivity: { School: { privateSchool: true } },
    };
    const privateSchoolEventsLastMonth = await service.countEntitiesByProperties(
      EventNote,
      privateSchoolsLastMonthQuery
    );
    expect(privateSchoolEventsLastMonth).toBe(2);

    const otherSchoolsLast8DaysQuery = {
      date: { gte: moment().subtract(8, "days").toDate() },
      RecurringActivity: { School: { privateSchool: { not: true } } },
    };
    const otherSchoolEventsLast8Days = await service.countEntitiesByProperties(
      EventNote,
      otherSchoolsLast8DaysQuery
    );
    expect(otherSchoolEventsLast8Days).toBe(2);

    const lastMonthQuery = {
      date: { gte: moment().subtract(1, "month").toDate() },
    };
    const allEventsLastMonth = await service.countEntitiesByProperties(
      EventNote,
      lastMonthQuery
    );
    expect(allEventsLastMonth).toBe(7);
  });

  it("should count participants of events based on timespan, school and activity", async () => {
    const maleChild = new Child();
    maleChild.gender = Gender.MALE;
    const femaleChild1 = new Child();
    femaleChild1.gender = Gender.FEMALE;
    const femaleChild2 = new Child();
    femaleChild2.gender = Gender.FEMALE;

    const privateSchool = new School();
    privateSchool.privateSchool = true;
    const normalSchool = new School();

    const privateActivity = new RecurringActivity();
    privateActivity.linkedGroups = [privateSchool.getId()];
    const normalActivity = new RecurringActivity();
    normalActivity.linkedGroups = [normalSchool.getId()];
    const activityWithoutLink = new RecurringActivity();

    const twoWeeksAgoPrivateEvent = new EventNote();
    twoWeeksAgoPrivateEvent.date = moment().subtract(2, "weeks").toDate();
    twoWeeksAgoPrivateEvent.relatesTo = privateActivity._id;
    twoWeeksAgoPrivateEvent.addChild(maleChild.getId());
    twoWeeksAgoPrivateEvent.addChild(femaleChild2.getId())

    const threeDaysAgoPrivateEvent = new EventNote();
    threeDaysAgoPrivateEvent.date = moment().subtract(3, "days").toDate();
    threeDaysAgoPrivateEvent.relatesTo = privateActivity._id;
    threeDaysAgoPrivateEvent.addChild(maleChild.getId());

    const sixDaysAgoNormalEvent = new EventNote();
    sixDaysAgoNormalEvent.date = moment().subtract(6, "days").toDate();
    sixDaysAgoNormalEvent.relatesTo = normalActivity._id;
    sixDaysAgoNormalEvent.addChild(femaleChild1.getId());

    const todayEventWithoutSchool = new EventNote();
    todayEventWithoutSchool.date = new Date();
    todayEventWithoutSchool.relatesTo = activityWithoutLink._id;
    todayEventWithoutSchool.addChild(femaleChild1.getId());
    todayEventWithoutSchool.addChild(maleChild.getId());

    const twoDaysAgoEventWithoutRelation = new EventNote();
    twoDaysAgoEventWithoutRelation.date = moment().subtract(2, "days").toDate();
    twoDaysAgoEventWithoutRelation.addChild(femaleChild1.getId());
    twoDaysAgoEventWithoutRelation.addChild(femaleChild2.getId());


    mockEntityMapper.loadType.and.callFake(loadTypeFake(
      [femaleChild2, maleChild, femaleChild1],
      [privateSchool, normalSchool],
      [normalActivity, privateActivity, activityWithoutLink],
      [threeDaysAgoPrivateEvent, twoWeeksAgoPrivateEvent, twoDaysAgoEventWithoutRelation, todayEventWithoutSchool, twoDaysAgoEventWithoutRelation]
    ));

  });
});
