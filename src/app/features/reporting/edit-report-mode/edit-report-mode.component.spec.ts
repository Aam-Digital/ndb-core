import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UntypedFormGroup } from "@angular/forms";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import { EditReportModeComponent } from "./edit-report-mode.component";
import { SqlReportService } from "../sql-report/sql-report.service";

describe("EditReportModeComponent", () => {
  let component: EditReportModeComponent;
  let fixture: ComponentFixture<EditReportModeComponent>;
  let formGroup: UntypedFormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReportModeComponent, NoopAnimationsModule],
      providers: [
        {
          provide: SqlReportService,
          useValue: { isReportingBackendEnabled: () => Promise.resolve(false) },
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReportModeComponent);
    component = fixture.componentInstance;
    formGroup = setupCustomFormControlEditComponent(
      component,
      "mode",
      {},
      fixture,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows the SQL feature warning only when SQL mode is selected", () => {
    const warning = () =>
      fixture.nativeElement.querySelector("app-feature-disabled-info");

    expect(warning()).toBeNull();

    formGroup.get("mode").setValue("reporting");
    fixture.detectChanges();
    expect(warning()).toBeNull();

    formGroup.get("mode").setValue("sql");
    fixture.detectChanges();
    expect(warning()).toBeTruthy();
  });
});
