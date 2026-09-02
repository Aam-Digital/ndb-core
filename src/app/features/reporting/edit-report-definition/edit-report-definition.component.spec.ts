import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  NgControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
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
  /** simulate a drop, `draggedLevels` being how far the row was dragged sideways */
  const drop = (
    previousIndex: number,
    currentIndex: number,
    draggedLevels = 0,
  ) =>
    component.onDrop({
      previousIndex,
      currentIndex,
      distance: { x: draggedLevels * component.indentPerLevel, y: 0 },
    } as CdkDragDrop<unknown>);

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

  it("uses the structured SQL editor for sql mode and the JSON editor otherwise", () => {
    expect(createWithMode("sql").isSql()).toBe(true);
    expect(createWithMode("reporting").isSql()).toBe(false);
    expect(createWithMode("exporting").isSql()).toBe(false);
  });

  it("loads an external definition into flat rows with the right nesting levels", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { query: "SELECT a FROM t" },
        { groupTitle: "G", items: [{ query: "SELECT b FROM t" }] },
      ]);
    fixture.detectChanges();

    expect(component.rows().map((r) => [r.isGroup, r.level])).toEqual([
      [false, 0],
      [true, 0],
      [false, 1],
    ]);
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

  it("removes a group together with its whole subtree", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { groupTitle: "G", items: [{ query: "a" }, { query: "b" }] },
        { query: "c" },
      ]);
    fixture.detectChanges();

    component.remove(0); // the group at index 0 (plus its two children)

    expect(definition()).toEqual([{ query: "c" }]);
  });

  it("adds a query and a sub-group directly into a group via its + buttons", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ groupTitle: "G", items: [] }]);
    fixture.detectChanges();

    component.addChildGroup(0); // sub-group as first child of G
    component.addChildQuery(0); // query as first child of G (before the sub-group)

    expect(definition()).toEqual([
      {
        groupTitle: "G",
        items: [{ query: "" }, { groupTitle: "New group", items: [] }],
      },
    ]);
  });

  it("moves a group with its subtree on drop", () => {
    formGroup
      .get("reportDefinition")
      .setValue([
        { query: "top" },
        { groupTitle: "G", items: [{ query: "a" }, { query: "b" }] },
      ]);
    fixture.detectChanges();

    drop(1, 0); // drag the group (row 1) above "top"

    expect(definition()).toEqual([
      { groupTitle: "G", items: [{ query: "a" }, { query: "b" }] },
      { query: "top" },
    ]);
  });

  it("does not re-mark the control dirty when a change resolves to the current value", () => {
    formGroup.get("reportDefinition").setValue([{ query: "a" }]);
    fixture.detectChanges();

    // a query editor re-emitting its unchanged value (e.g. reflow after save) must not re-dirty
    component.setQuery(0, "a");

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

    drop(0, 1);

    expect(definition()).toEqual([{ query: "b" }, { query: "a" }]);
  });

  it("nests a query into the group above it when dragged to the right", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ groupTitle: "G", items: [] }, { query: "a" }]);
    fixture.detectChanges();

    drop(1, 1, 1); // dragged one indentation step to the right

    expect(definition()).toEqual([
      { groupTitle: "G", items: [{ query: "a" }] },
    ]);
  });

  it("lifts a query out of its group when dragged to the left", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ groupTitle: "G", items: [{ query: "a" }] }]);
    fixture.detectChanges();

    drop(1, 1, -1);

    expect(definition()).toEqual([
      { groupTitle: "G", items: [] },
      { query: "a" },
    ]);
  });

  it("does not nest a query below another query, however far it is dragged", () => {
    formGroup
      .get("reportDefinition")
      .setValue([{ query: "a" }, { query: "b" }]);
    fixture.detectChanges();

    drop(1, 1, 3);

    expect(definition()).toEqual([{ query: "a" }, { query: "b" }]);
  });
});
