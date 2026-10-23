import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EditSchemaEmbedArrayComponent } from "./edit-schema-embed-array.component";
import { SchemaEmbedArrayDialogComponent } from "./schema-embed-array-dialog/schema-embed-array-dialog.component";
import { DisplaySchemaEmbedArrayComponent } from "../display-schema-embed-array/display-schema-embed-array.component";

describe("EditSchemaEmbedArrayComponent", () => {
  let component: EditSchemaEmbedArrayComponent;
  let fixture: ComponentFixture<EditSchemaEmbedArrayComponent>;
  let formControl: FormControl<Record<string, any>[]>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        EditSchemaEmbedArrayComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
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
      label: "Identification Documents",
      additional: {
        documentType: { dataType: "string", label: "Document Type" },
        documentNumber: { dataType: "string", label: "Document Number" },
      },
    });
    fixture.detectChanges();
  });

  const summary = () =>
    fixture.debugElement.query(By.directive(DisplaySchemaEmbedArrayComponent))
      ?.componentInstance as DisplaySchemaEmbedArrayComponent | undefined;
  const button = () => fixture.debugElement.query(By.css("button"));

  it("shows a summary of the current entries", () => {
    expect(summary().rows()).toEqual(formControl.value);
    expect(summary().formFieldConfig().id).toBe("documents");
  });

  it("updates the summary when the value changes", () => {
    formControl.setValue([...formControl.value, {}]);
    fixture.detectChanges();

    expect(summary().rows()).toHaveLength(3);
  });

  it("shows a 'no entries' text instead of the summary when empty", () => {
    formControl.setValue([]);
    fixture.detectChanges();

    expect(summary()).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain("no entries");
  });

  it("opens the dialog when clicking the field, also when disabled (read-only)", () => {
    component.onContainerClick();
    expect(mockDialog.open).toHaveBeenCalledTimes(1);

    formControl.disable();
    fixture.detectChanges();
    expect(button().nativeElement.disabled).toBe(false);
    component.onContainerClick();
    expect(mockDialog.open).toHaveBeenCalledTimes(2);
  });

  it("opens the dialog with the field's formControl, resolved columns and label", () => {
    fixture.detectChanges();

    button().nativeElement.click();

    expect(mockDialog.open).toHaveBeenCalledWith(
      SchemaEmbedArrayDialogComponent,
      expect.objectContaining({
        data: {
          formControl,
          columns: [
            expect.objectContaining({
              id: "documentType",
              label: "Document Type",
              viewComponent: "DisplayText",
            }),
            expect.objectContaining({
              id: "documentNumber",
              label: "Document Number",
              viewComponent: "DisplayText",
            }),
          ],
          entity: undefined,
          label: "Identification Documents",
        },
      }),
    );
  });

  it("resolves no columns when additional is not configured", () => {
    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
    });
    fixture.detectChanges();

    expect(component.columns()).toEqual([]);
  });
});
