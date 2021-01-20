import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from "@angular/core/testing";

import { ActivitySetupComponent } from "./activity-setup.component";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { AttendanceService } from "../attendance.service";
import { RecurringActivity } from "../model/recurring-activity";
import { Note } from "../../notes/model/note";

describe("ActivitySetupComponent", () => {
  let component: ActivitySetupComponent;
  let fixture: ComponentFixture<ActivitySetupComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(async(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", [
      "save",
      "loadType",
    ]);
    mockEntityService.loadType.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
      "getEventsOnDate",
    ]);
    mockAttendanceService.getEventsOnDate.and.resolveTo([]);

    TestBed.configureTestingModule({
      declarations: [ActivitySetupComponent],
      imports: [FormDialogModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User("") },
        },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("generates a filled event Note from the RecurringActivity", fakeAsync(() => {
    const testActivities = [
      RecurringActivity.create("act 1"),
      RecurringActivity.create("act 2"),
    ];
    const testInteractionType = { id: "interaction1", label: "Interaction" };
    testActivities[0].type = testInteractionType;

    mockEntityService.loadType.and.resolveTo(testActivities);
    component.ngOnInit();
    flush();

    expect(component.existingEvents.length).toBe(2);
    expect(component.existingEvents[0]).toEqual(
      jasmine.objectContaining({
        category: testInteractionType,
        subject: "act 1",
      } as Partial<Note>)
    );
  }));
});
