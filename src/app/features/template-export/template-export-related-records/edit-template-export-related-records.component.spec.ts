import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EditTemplateExportRelatedRecordsComponent } from "./edit-template-export-related-records.component";
import { TemplateExportRelatedRecords } from "./template-export-related-records";

describe("EditTemplateExportRelatedRecordsComponent", () => {
  @DatabaseEntity("EditRelatedProject")
  class Project extends Entity {
    static override label = "Project";

    @DatabaseField({ label: "Title" }) title: string;
  }

  @DatabaseEntity("EditRelatedUnlinked")
  class Unlinked extends Entity {
    static override label = "Unlinked";
  }

  @DatabaseEntity("EditRelatedAction")
  class Action extends Entity {
    static override label = "Action";
    static override labelPlural = "Actions";
    static override toStringAttributes = ["subject"];

    @DatabaseField({ label: "Subject" }) subject: string;

    @DatabaseField({
      label: "Parent action",
      dataType: "entity",
      additional: "EditRelatedAction",
    })
    parentAction: string;

    @DatabaseField({
      label: "Project",
      dataType: "entity",
      additional: "EditRelatedProject",
    })
    project: string;
  }

  const PROJECT_ACTIONS: TemplateExportRelatedRecords = {
    key: "actions",
    entityType: Action.ENTITY_TYPE,
    property: "project",
  };
  const SUB_ACTIONS: TemplateExportRelatedRecords = {
    key: "subActions",
    entityType: Action.ENTITY_TYPE,
    property: "parentAction",
  };

  let component: EditTemplateExportRelatedRecordsComponent;
  let fixture: ComponentFixture<EditTemplateExportRelatedRecordsComponent>;
  let typesControl: FormControl<string[]>;
  let control: FormControl<TemplateExportRelatedRecords[]>;

  function setup(
    applicableTypes: string[],
    value: TemplateExportRelatedRecords[] = [],
  ) {
    typesControl = new FormControl(applicableTypes);
    control = new FormControl(value);
    new FormGroup({
      applicableForEntityTypes: typesControl,
      relatedRecords: control,
    });

    fixture = TestBed.createComponent(
      EditTemplateExportRelatedRecordsComponent,
    );
    component = fixture.componentInstance;
    component.ngControl = { control } as any;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditTemplateExportRelatedRecordsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();
  });

  it("offers the fields of other record types linking to the applicable record types currently selected", () => {
    setup([Project.ENTITY_TYPE]);
    expect(component.options().map((o) => o.label)).toEqual([
      'Actions (linked through "Project")',
    ]);

    typesControl.setValue([Action.ENTITY_TYPE]);
    expect(component.options().map((o) => o.label)).toEqual([
      'Actions (linked through "Parent action")',
    ]);

    typesControl.setValue([Unlinked.ENTITY_TYPE]);
    fixture.detectChanges();
    expect(component.options()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      "No other records link to the applicable record types",
    );
  });

  it("suggests a placeholder name that is not in use yet when selecting related records", () => {
    setup(
      [Project.ENTITY_TYPE],
      [{ ...PROJECT_ACTIONS, key: "relatedEditRelatedAction" }],
    );

    component.addRow();
    component.selectOption(1, component.options()[0].id);

    expect(control.value[1]).toEqual({
      ...PROJECT_ACTIONS,
      key: "relatedEditRelatedAction2",
    });
    expect(control.valid).toBe(true);
    expect(control.dirty).toBe(true);
  });

  it("shows the placeholder to use in the template file, including nested levels of a hierarchy", () => {
    setup([Action.ENTITY_TYPE], [SUB_ACTIONS]);
    expect(fixture.nativeElement.textContent).toContain(
      "{d.subActions[i].subject}",
    );

    // limited to the supported number of levels
    component.setLevels(0, "99");
    fixture.detectChanges();

    expect(control.value).toEqual([{ ...SUB_ACTIONS, levels: 5 }]);
    // one example per level
    expect(fixture.nativeElement.textContent).toContain(
      "{d.subActions[i].subActions[i].subActions[i].subActions[i].subActions[i].subject}",
    );

    component.setLevels(0, "1");
    expect(control.value).toEqual([SUB_ACTIONS]);
  });

  it.each<[string, TemplateExportRelatedRecords[], boolean]>([
    ["no related records", [], true],
    ["a complete entry", [PROJECT_ACTIONS], true],
    [
      "an entry without selected related records",
      [{ key: "x", entityType: "", property: "" }],
      false,
    ],
    [
      "an entry without placeholder name",
      [{ ...PROJECT_ACTIONS, key: "" }],
      false,
    ],
    [
      "a placeholder name that breaks the placeholder syntax",
      [{ ...PROJECT_ACTIONS, key: "my actions" }],
      false,
    ],
    [
      "a placeholder name not starting with a letter",
      [{ ...PROJECT_ACTIONS, key: "_actions" }],
      false,
    ],
    [
      "a placeholder name that is a field of the record type",
      [{ ...PROJECT_ACTIONS, key: "title" }],
      false,
    ],
    [
      "the same placeholder name twice",
      [PROJECT_ACTIONS, PROJECT_ACTIONS],
      false,
    ],
    [
      "related records that do not link to the applicable record types",
      [SUB_ACTIONS],
      false,
    ],
  ])("validates %s", (_name, value, expectedValid) => {
    setup([Project.ENTITY_TYPE], value);

    expect(control.valid).toBe(expectedValid);
  });

  it("re-validates the related records when the applicable record types change", () => {
    setup([Project.ENTITY_TYPE], [PROJECT_ACTIONS]);
    expect(control.valid).toBe(true);

    typesControl.setValue([Unlinked.ENTITY_TYPE]);

    expect(control.valid).toBe(false);
  });
});
