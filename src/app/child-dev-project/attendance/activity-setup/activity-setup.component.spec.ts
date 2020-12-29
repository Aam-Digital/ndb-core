import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivitySetupComponent } from "./activity-setup.component";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { AttendanceService } from "../attendance.service";

describe("ActivitySetupComponent", () => {
  let component: ActivitySetupComponent;
  let fixture: ComponentFixture<ActivitySetupComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(async(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", ["save"]);
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
});
