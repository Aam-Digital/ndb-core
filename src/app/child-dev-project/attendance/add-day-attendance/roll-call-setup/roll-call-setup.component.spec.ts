import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { ChildrenService } from "../../../children/children.service";
import { AttendanceModule } from "../../attendance.module";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceService } from "../../attendance.service";
import { EventNote } from "../../model/event-note";
import {
  MockSessionModule,
  TEST_USER,
} from "../../../../core/session/mock-session.module";
import {
  ENTITIES,
  entityRegistry,
} from "../../../../core/registry/dynamic-registry";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj([
      "getEventsOnDate",
      "createEventForActivity",
    ]);
    mockAttendanceService.getEventsOnDate.and.resolveTo([]);

    TestBed.configureTestingModule({
      declarations: [RollCallSetupComponent],
      imports: [
        AttendanceModule,
        MatNativeDateModule,
        MockSessionModule.withState(),
      ],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: ENTITIES, useValue: entityRegistry },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("generates event notes with current user as author", fakeAsync(() => {
    const testActivities = [
      RecurringActivity.create("act 1"),
      RecurringActivity.create("act 2"),
    ];
    mockAttendanceService.createEventForActivity.and.resolveTo(new EventNote());
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "loadType").and.resolveTo(testActivities);

    component.ngOnInit();
    flush();

    expect(component.existingEvents.length).toBe(2);
    expect(component.existingEvents[0].authors).toEqual([TEST_USER]);
    expect(component.existingEvents[1].authors).toEqual([TEST_USER]);
  }));
});
