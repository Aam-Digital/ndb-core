/*
 * Kept for its setup, not its assertion.
 *
 * This component needs real providers or inputs to be constructed at all, so it cannot join
 * the sweep in `src/app/component-smoke.spec.ts`, and working out what it depends on is the
 * expensive part of writing a test for it. The construction check below is a placeholder:
 * the component has enough logic to deserve real assertions, so add them here rather than
 * starting a new file.
 */
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
