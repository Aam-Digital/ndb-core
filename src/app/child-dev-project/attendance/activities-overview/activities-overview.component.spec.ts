import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { RecurringActivity } from "../model/recurring-activity";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { UpdatedEntity } from "../../../core/entity/model/entity-update";
import { Subject } from "rxjs";
import { School } from "../../schools/model/school";

import { ActivitiesOverviewComponent } from "./activities-overview.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

describe("ActivitiesOverviewComponent", () => {
  let component: ActivitiesOverviewComponent;
  let fixture: ComponentFixture<ActivitiesOverviewComponent>;

  let entityMapper: MockEntityMapperService;

  beforeEach(waitForAsync(() => {
    entityMapper = mockEntityMapper();
    TestBed.configureTestingModule({
      imports: [ActivitiesOverviewComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitiesOverviewComponent);
    component = fixture.componentInstance;
    component.entity = new School();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch all and only recurring activities having the selected school as a linkedGroup", async () => {
    const school1 = new School("school1");
    const activity1 = new RecurringActivity();
    activity1.linkedGroups = ["school1"];
    const activity2 = new RecurringActivity();
    activity2.linkedGroups = ["school1", "school2"];
    const activity3 = new RecurringActivity();
    activity3.linkedGroups = ["school3"];
    entityMapper.addAll([activity1, activity2, activity3]);

    component.entity = school1;
    await component.ngOnInit();
    expect(component.records).toEqual([activity1, activity2]);
  });

  it("should create a new recurring activity having the current school as a linkedGroup", () => {
    component.entity = new School("school1");
    const newRecurringActivity = component.generateNewRecordFactory();
    expect(newRecurringActivity().linkedGroups).toEqual(["school1"]);
  });

  it("should remove the recurring activity from the table view if the current school is removed as a group of this recurring activity", fakeAsync(() => {
    const school1 = new School("school1");
    const activity1 = new RecurringActivity();
    activity1.linkedGroups = ["school1"];
    const activity2 = new RecurringActivity();
    activity2.linkedGroups = ["school1", "school2", "school3"];
    entityMapper.addAll([activity1, activity2]);
    const subject = new Subject<UpdatedEntity<RecurringActivity>>();
    spyOn(entityMapper, "receiveUpdates").and.returnValue(subject);
    component.entity = school1;
    component.ngOnInit();
    tick();

    expect(component.records).toEqual([activity1, activity2]);

    activity2.linkedGroups = ["school2", "school3"];
    subject.next({ entity: activity2, type: "update" });
    tick();

    expect(component.records).toEqual([activity1]);
  }));
});
