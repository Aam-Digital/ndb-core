import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
import { RouterModule } from "@angular/router";
import { ComingSoonDialogService } from "#src/app/features/coming-soon/coming-soon-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AttendanceService } from "../../attendance.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { signal } from "@angular/core";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AttendanceManagerComponent,
        RouterModule.forRoot([]),
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: ComingSoonDialogService, useValue: null },
        {
          provide: AttendanceService,
          useValue: {
            eventTypeSettings: [],
            activityTypes: signal([]),
            eventTypes: signal([]),
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
