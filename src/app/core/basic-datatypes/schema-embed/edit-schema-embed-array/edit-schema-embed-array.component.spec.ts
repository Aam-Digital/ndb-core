import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EditSchemaEmbedArrayComponent } from "./edit-schema-embed-array.component";
import { EditTextComponent } from "#src/app/core/basic-datatypes/string/edit-text/edit-text.component";

describe("EditSchemaEmbedArrayComponent", () => {
  let component: EditSchemaEmbedArrayComponent;
  let fixture: ComponentFixture<EditSchemaEmbedArrayComponent>;
  let formControl: FormControl<Record<string, any>[]>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditSchemaEmbedArrayComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditSchemaEmbedArrayComponent);
    component = fixture.componentInstance;

    formControl = new FormControl<Record<string, any>[]>([
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ]);
    component.ngControl = { control: formControl } as any;

    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
      additional: {
        documentType: { dataType: "string", label: "Document Type" },
        documentNumber: { dataType: "string", label: "Document Number" },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
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

  it("renders no columns when additional is not configured", () => {
    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
    });
    fixture.detectChanges();

    expect(component.columns()).toEqual([]);
    // only the blank leading header (for the remove-row button column) remains
    expect(fixture.debugElement.queryAll(By.css("th"))).toHaveLength(1);
  });
});
