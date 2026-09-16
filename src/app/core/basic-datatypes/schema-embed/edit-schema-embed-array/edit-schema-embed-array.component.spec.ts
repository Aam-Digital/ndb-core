import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
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

  it("shows a button with the current number of entries while enabled", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.textContent).toContain("2");
  });

  it("updates the displayed count when the value changes", () => {
    formControl.setValue([...formControl.value, {}]);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.textContent).toContain("3");
  });

  it("replaces the button with a read-only preview once the control is disabled", () => {
    // the surrounding mat-form-field sets pointer-events:none on itself while disabled
    // (Material's standard behavior), so the button would be unclickable there - showing
    // a plain read-only preview instead matches how every other field type still displays
    // its value inline while disabled.
    formControl.disable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css("button"))).toBeFalsy();
    const display = fixture.debugElement.query(
      By.directive(DisplaySchemaEmbedArrayComponent),
    );
    expect(display).toBeTruthy();
    expect(display.componentInstance.value()).toEqual(formControl.value);
  });

  it("shows the button again once a disabled control is re-enabled", () => {
    formControl.disable();
    fixture.detectChanges();
    formControl.enable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css("button"))).toBeTruthy();
    expect(
      fixture.debugElement.query(
        By.directive(DisplaySchemaEmbedArrayComponent),
      ),
    ).toBeFalsy();
  });

  it("opens the dialog with the field's formControl, resolved columns, entity and label", () => {
    const entity = new TestEntity();
    fixture.componentRef.setInput("entity", entity);
    fixture.detectChanges();

    fixture.debugElement.query(By.css("button")).nativeElement.click();

    expect(mockDialog.open).toHaveBeenCalledWith(
      SchemaEmbedArrayDialogComponent,
      expect.objectContaining({
        data: {
          formControl,
          columns: [
            expect.objectContaining({
              id: "documentType",
              label: "Document Type",
            }),
            expect.objectContaining({
              id: "documentNumber",
              label: "Document Number",
            }),
          ],
          entity,
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
