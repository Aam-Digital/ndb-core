import { TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  NgControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { EditReportPeriodToggleComponent } from "./edit-report-period-toggle.component";

const REPORT_PERIOD = {
  startDate: ["SQL_FROM_DATE"],
  endDate: ["SQL_TO_DATE"],
};

/** wire the component to a `transformations` control alongside sibling `mode` + `reportDefinition` controls */
function create(
  mode: string,
  reportDefinition: unknown,
  transformations: Record<string, string[]> = {},
): {
  component: EditReportPeriodToggleComponent;
  formGroup: UntypedFormGroup;
} {
  const formGroup = new UntypedFormGroup({
    mode: new UntypedFormControl(mode),
    reportDefinition: new UntypedFormControl(reportDefinition),
    transformations: new UntypedFormControl(transformations),
  });
  const fixture = TestBed.createComponent(EditReportPeriodToggleComponent);
  const component = fixture.componentInstance;
  component.ngControl = {
    control: formGroup.get("transformations"),
  } as NgControl;
  fixture.componentRef.setInput("formFieldConfig", { id: "transformations" });
  fixture.detectChanges();
  return { component, formGroup };
}

describe("EditReportPeriodToggleComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReportPeriodToggleComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it("should create", () => {
    expect(create("sql", []).component).toBeTruthy();
  });

  it("derives usesDateRange from $startDate/$endDate for sql, and is always on for non-sql", () => {
    expect(
      create("sql", [{ query: "SELECT * FROM c" }]).component.usesDateRange(),
    ).toBe(false);
    expect(
      create("sql", [
        { query: "SELECT * FROM c WHERE d BETWEEN $startDate AND $endDate" },
      ]).component.usesDateRange(),
    ).toBe(true);
    // non-sql (in-browser) reports always run over the report period
    expect(
      create("reporting", [{ query: "X:toArray" }]).component.usesDateRange(),
    ).toBe(true);
  });

  it("writes the derived transformations when a SQL query starts using the date range", () => {
    const { formGroup } = create("sql", [{ query: "SELECT * FROM c" }]);
    expect(formGroup.get("transformations").value).toEqual({});

    formGroup
      .get("reportDefinition")
      .setValue([{ query: "SELECT * FROM c WHERE d > $startDate" }]);

    expect(formGroup.get("transformations").value).toEqual(REPORT_PERIOD);
    expect(formGroup.get("transformations").dirty).toBe(true);
  });

  it("clears the report-period transformations when the SQL query stops using the date range", () => {
    const { formGroup } = create(
      "sql",
      [{ query: "SELECT * FROM c WHERE d BETWEEN $startDate AND $endDate" }],
      { ...REPORT_PERIOD },
    );

    formGroup.get("reportDefinition").setValue([{ query: "SELECT * FROM c" }]);

    expect(formGroup.get("transformations").value).toEqual({});
  });

  it("does not touch transformations for non-SQL reports", () => {
    const { formGroup } = create("reporting", [{ query: "X:toArray" }]);

    formGroup
      .get("reportDefinition")
      .setValue([{ query: "X:toArray[* date >= ? & date <= ?]" }]);

    expect(formGroup.get("transformations").value).toEqual({});
  });
});
