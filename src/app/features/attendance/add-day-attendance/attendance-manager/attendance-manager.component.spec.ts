import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ComingSoonDialogService } from "#src/app/features/coming-soon/coming-soon-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AttendanceService } from "../../attendance.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AttendanceManagerComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: ComingSoonDialogService, useValue: null },
        {
          provide: AttendanceService,
          useValue: {
            featureSettings: {
              activityTypes: [],
              recurringActivityTypes: [],
              eventTypes: [],
              filterConfig: [],
            },
          },
        },
        {
          provide: EntityAbility,
          useValue: {
            can: () => true,
            cannot: () => false,
            on: () => () => null,
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
