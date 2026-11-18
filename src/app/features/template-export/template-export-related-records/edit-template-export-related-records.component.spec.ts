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
    entityType: Action.ENTITY_TYPE,
    property: "project",
  };
  const SUB_ACTIONS: TemplateExportRelatedRecords = {
    entityType: Action.ENTITY_TYPE,
    property: "parentAction",
  };

  let component: EditTemplateExportRelatedRecordsComponent;
  let fixture: ComponentFixture<EditTemplateExportRelatedRecordsComponent>;
  let typesControl: FormControl<string[]>;
  let control: FormControl<TemplateExportRelatedRecords[]>;
  let arrayReportControl: FormControl<boolean>;

  function setup(
    applicableTypes: string[],
    value: TemplateExportRelatedRecords[] = [],
  ) {
    typesControl = new FormControl(applicableTypes);
    control = new FormControl(value);
    arrayReportControl = new FormControl(false);
    new FormGroup({
      applicableForEntityTypes: typesControl,
      arrayReport: arrayReportControl,
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

  it("shows the placeholder to use in the template file, including nested levels of a hierarchy", () => {
    setup([Action.ENTITY_TYPE], [SUB_ACTIONS]);
    expect(fixture.nativeElement.textContent).toContain(
      "{d._related.EditRelatedAction.parentAction[i].subject}",
    );

    // limited to the supported number of levels
    component.setLevels(0, "99");
    fixture.detectChanges();

    expect(control.value).toEqual([{ ...SUB_ACTIONS, levels: 5 }]);
    // one example per level
    expect(fixture.nativeElement.textContent).toContain(
      "{d._related.EditRelatedAction.parentAction[i]._related.EditRelatedAction.parentAction[i]._related.EditRelatedAction.parentAction[i]._related.EditRelatedAction.parentAction[i]._related.EditRelatedAction.parentAction[i].subject}",
    );

    component.setLevels(0, "1");
    expect(control.value).toEqual([SUB_ACTIONS]);

    // in a "Multi-Record Report", d is the list of the selected records
    arrayReportControl.setValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "{d[i]._related.EditRelatedAction.parentAction[i].subject}",
    );
  });

  it("drops the levels when selecting related records that do not form a hierarchy", () => {
    setup(
      [Action.ENTITY_TYPE, Project.ENTITY_TYPE],
      [{ ...SUB_ACTIONS, levels: 3 }],
    );

    component.selectOption(
      0,
      PROJECT_ACTIONS.entityType + "::" + PROJECT_ACTIONS.property,
    );

    expect(control.value).toEqual([PROJECT_ACTIONS]);
  });

  it("shows the saved levels in the input, also when an entered value is limited to the same value again", () => {
    setup([Action.ENTITY_TYPE], [{ ...SUB_ACTIONS, levels: 5 }]);
    const levelsInput: HTMLInputElement =
      fixture.nativeElement.querySelector("input[type=number]");

    levelsInput.value = "10";
    levelsInput.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(control.value).toEqual([{ ...SUB_ACTIONS, levels: 5 }]);
    expect(levelsInput.value).toBe("5");
  });

  it.each<[string, TemplateExportRelatedRecords[], boolean]>([
    ["no related records", [], true],
    ["a complete entry", [PROJECT_ACTIONS], true],
    [
      "an entry without selected related records",
      [{ entityType: "", property: "" }],
      false,
    ],
    [
      "the same related records twice",
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
