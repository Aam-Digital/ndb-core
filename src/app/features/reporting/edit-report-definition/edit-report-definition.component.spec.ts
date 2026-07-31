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

  const definition = () => formGroup.get("reportDefinition").value;

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

  it("uses the structured SQL editor for sql mode and the JSON editor otherwise", () => {
    expect(createWithMode("sql").isSql()).toBe(true);
    expect(createWithMode("reporting").isSql()).toBe(false);
    expect(createWithMode("exporting").isSql()).toBe(false);
  });

  it("loads an external definition into the working tree", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { query: "SELECT a FROM t" },
        { groupTitle: "G", items: [{ query: "SELECT b FROM t" }] },
      ]);
    fixture.detectChanges();

    const tree = component.uiTree();
    expect(tree.length).toBe(2);
    expect(tree[1].items.length).toBe(1);
    expect(tree[1].items[0].query).toBe("SELECT b FROM t");
  });

  it("adds a query and a group at the root and persists to the bound control", () => {
    component.addQuery();
    component.addGroup();

    expect(definition()).toEqual([
      { query: "" },
      { groupTitle: "New group", items: [] },
    ]);
    expect(formGroup.get("reportDefinition").dirty).toBe(true);
  });

  it("removes a root node", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ query: "a" }, { query: "b" }]);
    fixture.detectChanges();

    component.removeRoot(component.uiTree()[0]);

    expect(definition()).toEqual([{ query: "b" }]);
  });

  it("persists an edited node coming from a child component", () => {
    formGroup.get("reportDefinition").setValue([{ query: "a" }]);
    fixture.detectChanges();

    component.onRootChange({ ...component.uiTree()[0], query: "SELECT 1" });

    expect(definition()).toEqual([{ query: "SELECT 1" }]);
  });

  it("does not re-mark the control dirty when a change resolves to the current value", () => {
    formGroup.get("reportDefinition").setValue([{ query: "a" }]);
    fixture.detectChanges();

    // e.g. a query editor re-emitting its unchanged value as the form value reflows
    // back into the tree after a save/reset must not re-dirty the saved form
    component.onRootChange({ ...component.uiTree()[0] });

    expect(formGroup.get("reportDefinition").dirty).toBe(false);
  });

  it("marks the control dirty before emitting the new value to subscribers", () => {
    const control = formGroup.get("reportDefinition");
    let dirtyWhenEmitted: boolean;
    control.valueChanges.subscribe(() => (dirtyWhenEmitted = control.dirty));

    component.addQuery();

    expect(dirtyWhenEmitted).toBe(true);
  });

  it("reorders items on drop and persists the new order", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ query: "a" }, { query: "b" }]);
    fixture.detectChanges();

    const list = component.uiTree();
    component.onDrop({
      previousContainer: { data: list },
      container: { data: list },
      previousIndex: 0,
      currentIndex: 1,
    } as never);

    expect(definition()).toEqual([{ query: "b" }, { query: "a" }]);
  });
});
