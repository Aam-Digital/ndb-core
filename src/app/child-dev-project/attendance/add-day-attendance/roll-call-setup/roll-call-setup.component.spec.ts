import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { ChildrenService } from "../../../children/children.service";
import { AttendanceModule } from "../../attendance.module";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceService } from "../../attendance.service";
import { EventNote } from "../../model/event-note";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  const user = { name: "TestUser", roles: [] };
  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", [
      "save",
      "loadType",
    ]);
    mockEntityService.loadType.and.resolveTo([]);

    mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);
    mockSessionService.getCurrentDBUser.and.returnValue(user);

    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj([
      "getEventsOnDate",
      "createEventForActivity",
    ]);
    mockAttendanceService.getEventsOnDate.and.resolveTo([]);

    TestBed.configureTestingModule({
      declarations: [RollCallSetupComponent],
      imports: [AttendanceModule, MatNativeDateModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: AttendanceService, useValue: mockAttendanceService },
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

    mockEntityService.loadType.and.resolveTo(testActivities);
    component.ngOnInit();
    flush();

    expect(component.existingEvents.length).toBe(2);
    expect(component.existingEvents[0].authors).toEqual([user.name]);
    expect(component.existingEvents[1].authors).toEqual([user.name]);
  }));
});
