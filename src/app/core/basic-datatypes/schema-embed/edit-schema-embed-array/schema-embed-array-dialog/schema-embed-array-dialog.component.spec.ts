import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { SchemaEmbedArrayTableComponent } from "../../schema-embed-array-table/schema-embed-array-table.component";
import {
  SchemaEmbedArrayDialogComponent,
  SchemaEmbedArrayDialogData,
} from "./schema-embed-array-dialog.component";

describe("SchemaEmbedArrayDialogComponent", () => {
  let component: SchemaEmbedArrayDialogComponent;
  let fixture: ComponentFixture<SchemaEmbedArrayDialogComponent>;
  let formControl: FormControl<Record<string, any>[]>;
  let dialogData: SchemaEmbedArrayDialogData;

  async function setup({
    disabled = false,
    value = [
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ],
  }: { disabled?: boolean; value?: Record<string, any>[] } = {}) {
    TestBed.resetTestingModule();

    formControl = new FormControl<Record<string, any>[]>(value);
    if (disabled) {
      formControl.disable();
    }

    dialogData = {
      formControl,
      columns: [
        { id: "documentType", dataType: "string", label: "Document Type" },
        { id: "documentNumber", dataType: "string", label: "Document Number" },
      ],
      entity: new TestEntity(),
      label: "Identification Documents",
    };

    await TestBed.configureTestingModule({
      imports: [
        SchemaEmbedArrayDialogComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArrayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function table(): SchemaEmbedArrayTableComponent {
    return fixture.debugElement.query(
      By.directive(SchemaEmbedArrayTableComponent),
    ).componentInstance;
  }

  beforeEach(() => setup());

  it("shows the dialog title from the passed-in label", () => {
    const title = fixture.debugElement.query(By.css("[mat-dialog-title]"));
    expect(title.nativeElement.textContent.trim()).toBe(
      "Identification Documents",
    );
  });

  it("lists the field's entries in the table", () => {
    expect(table().rows()).toEqual(formControl.value);
    expect(table().columns()).toBe(dialogData.columns);
    expect(table().entity()).toBe(dialogData.entity);
    expect(table().readonly()).toBe(false);
    // entries are saved only later with the surrounding form
    expect(table().deferSave()).toBe(true);
  });

  it("writes changed entries to the field's control and lists them", async () => {
    const changed = [{ documentType: "Visa", documentNumber: "C3" }];

    await table().applyChange()(changed);
    fixture.detectChanges();

    expect(formControl.value).toEqual(changed);
    expect(formControl.dirty).toBe(true);
    expect(table().rows()).toEqual(changed);
  });

  it("starts without entries if the field has no value yet", async () => {
    await setup({ value: null });

    expect(component.rows()).toEqual([]);
  });

  it("is read-only while the field is disabled", async () => {
    await setup({ disabled: true });

    expect(table().readonly()).toBe(true);
  });
});
