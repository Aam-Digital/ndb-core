import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  NgControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditReportDefinitionComponent } from "./edit-report-definition.component";

/** wire the component to a `reportDefinition` control sitting next to a `mode` control */
function createWithMode(mode: string): EditReportDefinitionComponent {
  const fg = new UntypedFormGroup({
    mode: new UntypedFormControl(mode),
    reportDefinition: new UntypedFormControl([]),
  });
  const fixture = TestBed.createComponent(EditReportDefinitionComponent);
  const component = fixture.componentInstance;
  component.ngControl = { control: fg.get("reportDefinition") } as NgControl;
  fixture.componentRef.setInput("formFieldConfig", { id: "reportDefinition" });
  fixture.detectChanges();
  return component;
}

describe("EditReportDefinitionComponent", () => {
  let component: EditReportDefinitionComponent;
  let fixture: ComponentFixture<EditReportDefinitionComponent>;
  let formGroup: UntypedFormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditReportDefinitionComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReportDefinitionComponent);
    component = fixture.componentInstance;
    formGroup = setupCustomFormControlEditComponent(
      component,
      "reportDefinition",
      {},
      fixture,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("uses the structured SQL editor for sql mode", () => {
    expect(createWithMode("sql").isSql()).toBe(true);
  });

  it("falls back to the JSON editor for reporting/exporting mode", () => {
    expect(createWithMode("reporting").isSql()).toBe(false);
    expect(createWithMode("exporting").isSql()).toBe(false);
  });

  it("flattens a nested definition into ordered query and group entries", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { query: "SELECT a FROM t" },
        { groupTitle: "G", items: [{ query: "SELECT count(*) FROM t" }] },
      ]);
    fixture.detectChanges();

    const entries = component.entries();
    expect(entries.map((e) => e.kind)).toEqual(["query", "group", "query"]);
    expect(entries[2].depth).toBe(1);
    expect(entries[2].query).toBe("SELECT count(*) FROM t");
  });

  it("adds a query and writes it into the bound form control", () => {
    component.addQuery();
    expect(component.entries().length).toBe(1);

    component.setQuery([0], "SELECT 1");
    expect(component.entries()[0].query).toBe("SELECT 1");
    // the edited value must reach the bound control so it is persisted on save
    expect(formGroup.get("reportDefinition").value).toEqual([
      { query: "SELECT 1" },
    ]);
    expect(formGroup.get("reportDefinition").dirty).toBe(true);
  });

  it("removes a nested item by path", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { groupTitle: "G", items: [{ query: "q1" }, { query: "q2" }] },
      ]);
    fixture.detectChanges();

    component.remove([0, 1]);

    expect(component.value).toEqual([
      { groupTitle: "G", items: [{ query: "q1" }] },
    ]);
  });
});
