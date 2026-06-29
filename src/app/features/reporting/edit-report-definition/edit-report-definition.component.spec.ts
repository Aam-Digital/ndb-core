import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { UntypedFormGroup } from "@angular/forms";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditReportDefinitionComponent } from "./edit-report-definition.component";

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

  it("adds a query and writes it to the bound value", () => {
    component.addQuery();
    expect(component.entries().length).toBe(1);

    component.setQuery([0], "SELECT 1");
    expect(component.entries()[0].query).toBe("SELECT 1");
    expect(component.value).toEqual([{ query: "SELECT 1" }]);
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
