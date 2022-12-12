import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditRecurringIntervalComponent } from "./edit-recurring-interval.component";
import { TasksModule } from "../../tasks.module";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ConfigService } from "../../../../core/config/config.service";
import { setupEditComponent } from "../../../../core/entity-components/entity-utils/dynamic-form-components/edit-component.spec";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TimeInterval } from "../time-interval";
import { of } from "rxjs";

describe("EditRecurringIntervalComponent", () => {
  let component: EditRecurringIntervalComponent;
  let fixture: ComponentFixture<EditRecurringIntervalComponent>;

  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj(["open"]);

    await TestBed.configureTestingModule({
      imports: [TasksModule, FontAwesomeTestingModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ConfigService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRecurringIntervalComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create the custom selected option on init if necessary", () => {
    const customInterval: TimeInterval = { value: 99, unit: "days" };
    component.formControl.setValue(customInterval);
    component.ngOnInit();

    expect(
      component.predefinedIntervals.find((o) => o.interval === customInterval)
    ).toBeTruthy();
  });

  it("should open dialog for custom interval and select the result", () => {
    const customIntervalResult: TimeInterval = { value: 88, unit: "days" };
    mockDialog.open.and.returnValue({
      afterClosed: () => of(customIntervalResult),
    } as MatDialogRef<typeof component>);

    component.openCustomIntervalSelection({
      source: undefined,
      isUserInput: true,
    });

    expect(component.predefinedIntervals).toContain({
      label: jasmine.any(String),
      interval: customIntervalResult,
    });
    expect(component.formControl.value).toBe(customIntervalResult);
  });

  it("should revert to the previously selected option if custom interval dialog is cancelled", () => {
    const previousInterval: TimeInterval = { value: 77, unit: "days" };
    component.formControl.setValue(previousInterval);
    component.ngOnInit();

    mockDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<typeof component>);

    component.openCustomIntervalSelection({
      source: undefined,
      isUserInput: true,
    });

    expect(component.formControl.value).toBe(previousInterval);
  });
});
