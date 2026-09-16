import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EditTextComponent } from "#src/app/core/basic-datatypes/string/edit-text/edit-text.component";
import {
  SchemaEmbedArrayDialogComponent,
  SchemaEmbedArrayDialogData,
} from "./schema-embed-array-dialog.component";

describe("SchemaEmbedArrayDialogComponent", () => {
  let component: SchemaEmbedArrayDialogComponent;
  let fixture: ComponentFixture<SchemaEmbedArrayDialogComponent>;
  let formControl: FormControl<Record<string, any>[]>;

  async function setup(data: Partial<SchemaEmbedArrayDialogData> = {}) {
    TestBed.resetTestingModule();

    formControl = new FormControl<Record<string, any>[]>([
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ]);

    const dialogData: SchemaEmbedArrayDialogData = {
      formControl,
      columns: [
        { id: "documentType", dataType: "string", label: "Document Type" },
        { id: "documentNumber", dataType: "string", label: "Document Number" },
      ],
      label: "Identification Documents",
      ...data,
    };

    await TestBed.configureTestingModule({
      imports: [
        SchemaEmbedArrayDialogComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: dialogData }],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArrayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => setup());

  it("shows the dialog title from the passed-in label", () => {
    const title = fixture.debugElement.query(By.css("[mat-dialog-title]"));
    expect(title.nativeElement.textContent.trim()).toBe(
      "Identification Documents",
    );
  });

  it("renders configured columns as table headers, in order", () => {
    const headers = fixture.debugElement
      .queryAll(By.css("th"))
      .map((h) => h.nativeElement.textContent.trim());

    expect(headers).toEqual(["", "Document Type", "Document Number"]);
  });

  it("renders one row per array entry", () => {
    expect(component.rows()).toHaveLength(2);
    expect(fixture.debugElement.queryAll(By.css("tbody tr"))).toHaveLength(2);
  });

  it("appends an empty row when addRow is called", () => {
    component.addRow();

    expect(formControl.value).toHaveLength(3);
    expect(formControl.value[2]).toEqual({});
  });

  it("removes exactly the targeted row, keeping other rows' content intact", () => {
    component.removeRow(0);

    expect(formControl.value).toHaveLength(1);
    expect(formControl.value[0]).toMatchObject({
      documentType: "ID Card",
      documentNumber: "B2",
    });
  });

  it("updates the correct row/column in the outer control when a cell changes", async () => {
    const textInputs = fixture.debugElement.queryAll(
      By.directive(EditTextComponent),
    );
    // second row's "documentType" cell
    const secondRowType = textInputs[2].componentInstance as EditTextComponent;
    secondRowType.formControl.setValue("Updated Type");

    expect(formControl.value[1]).toMatchObject({
      documentType: "Updated Type",
      documentNumber: "B2",
    });
    // first row is untouched
    expect(formControl.value[0]).toMatchObject({
      documentType: "Passport",
      documentNumber: "A1",
    });
  });

  it("marks the outer control dirty when a row is added, removed or edited", () => {
    expect(formControl.dirty).toBe(false);

    component.addRow();

    expect(formControl.dirty).toBe(true);
  });

  it("disables all cells and hides add/remove buttons when the outer control is disabled", () => {
    formControl.disable();
    fixture.detectChanges();

    expect(component.isDisabled()).toBe(true);
    expect(fixture.debugElement.queryAll(By.css(".remove-btn"))).toHaveLength(
      0,
    );
    expect(
      fixture.debugElement.queryAll(By.css("button[mat-button]")),
    ).toHaveLength(0);
  });

  it("renders only the blank leading header when there are no columns", async () => {
    await setup({ columns: [] });

    expect(fixture.debugElement.queryAll(By.css("th"))).toHaveLength(1);
  });
});
