import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
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
  let beforeClosed$: Subject<void>;

  async function setup(
    data: Partial<SchemaEmbedArrayDialogData> = {},
    { disabled = false }: { disabled?: boolean } = {},
  ) {
    TestBed.resetTestingModule();

    formControl = new FormControl<Record<string, any>[]>([
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ]);
    if (disabled) {
      formControl.disable();
    }

    beforeClosed$ = new Subject<void>();

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
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        {
          provide: MatDialogRef,
          useValue: { beforeClosed: () => beforeClosed$.asObservable() },
        },
      ],
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

  it("initializes rows from the field's value when opened", () => {
    expect(component.rows()).toHaveLength(2);
    expect(fixture.debugElement.queryAll(By.css("tbody tr"))).toHaveLength(2);
  });

  it("appends an empty row locally without touching the outer control yet", () => {
    component.addRow();
    fixture.detectChanges();

    expect(component.rows()).toHaveLength(3);
    expect(fixture.debugElement.queryAll(By.css("tbody tr"))).toHaveLength(3);
    // the outer control is only written to when the dialog closes
    expect(formControl.value).toHaveLength(2);
    expect(formControl.dirty).toBe(false);
  });

  it("removes exactly the targeted row locally without touching the outer control yet", () => {
    component.removeRow(0);
    fixture.detectChanges();

    expect(component.rows()).toHaveLength(1);
    expect(component.rows()[0].getRawValue()).toMatchObject({
      documentType: "ID Card",
      documentNumber: "B2",
    });
    expect(formControl.value).toHaveLength(2);
    expect(formControl.dirty).toBe(false);
  });

  it("edits a cell locally without touching the outer control yet", () => {
    const textInputs = fixture.debugElement.queryAll(
      By.directive(EditTextComponent),
    );
    // second row's "documentType" cell
    const secondRowType = textInputs[2].componentInstance as EditTextComponent;
    secondRowType.formControl.setValue("Updated Type");

    expect(component.rows()[1].getRawValue()).toMatchObject({
      documentType: "Updated Type",
      documentNumber: "B2",
    });
    expect(formControl.value[1]).toMatchObject({
      documentType: "ID Card",
      documentNumber: "B2",
    });
    expect(formControl.dirty).toBe(false);
  });

  it("writes the accumulated changes back to the outer control once the dialog closes", () => {
    component.removeRow(0);
    component.addRow();

    beforeClosed$.next();

    expect(formControl.value).toHaveLength(2);
    expect(formControl.value[0]).toMatchObject({
      documentType: "ID Card",
      documentNumber: "B2",
    });
    // a fresh, untouched row's controls normalize to null (Angular's FormControl default),
    // equivalent in meaning to the old literal {} but not identical in shape
    expect(formControl.value[1]).toEqual({
      documentType: null,
      documentNumber: null,
    });
    expect(formControl.dirty).toBe(true);
  });

  it("persists a newly added row even when the field never had a value before", async () => {
    const freshControl = new FormControl<Record<string, any>[]>(undefined);
    await setup({ formControl: freshControl });

    component.addRow();
    beforeClosed$.next();

    expect(freshControl.value).toEqual([
      { documentType: null, documentNumber: null },
    ]);
    expect(freshControl.dirty).toBe(true);
  });

  it("does not touch the outer control on close if nothing was changed", () => {
    const originalValue = formControl.value;

    beforeClosed$.next();

    expect(formControl.value).toBe(originalValue);
    expect(formControl.dirty).toBe(false);
  });

  it("disables all cells and hides add/remove buttons when the field starts disabled", async () => {
    await setup({}, { disabled: true });

    expect(fixture.debugElement.queryAll(By.css(".remove-btn"))).toHaveLength(
      0,
    );
    expect(
      fixture.debugElement.queryAll(By.css("button[mat-button]")),
    ).toHaveLength(0);
    expect(component.rows()[0].disabled).toBe(true);
  });

  it("renders only the blank leading header when there are no columns", async () => {
    await setup({ columns: [] });

    expect(fixture.debugElement.queryAll(By.css("th"))).toHaveLength(1);
  });
});
