import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { EditSchemaEmbedArrayComponent } from "./edit-schema-embed-array.component";
import { SchemaEmbedArrayDialogComponent } from "./schema-embed-array-dialog/schema-embed-array-dialog.component";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";

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

  it("shows a button with the current number of entries", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.textContent).toContain("2");
    expect(button.nativeElement.disabled).toBe(false);
  });

  it("updates the displayed count when the value changes", () => {
    formControl.setValue([...formControl.value, {}]);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.textContent).toContain("3");
  });

  it("keeps the button visible but visibly disabled when the control is disabled", () => {
    formControl.disable();
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css("button"));
    expect(button).toBeTruthy();
    expect(button.nativeElement.disabled).toBe(true);
  });

  it("shows the button again once a disabled control is re-enabled", () => {
    formControl.disable();
    fixture.detectChanges();
    formControl.enable();
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.disabled).toBe(false);
  });

  it("enables the hover preview tooltip whenever there are entries, regardless of disabled state", () => {
    formControl.disable();
    fixture.detectChanges();

    const directive = fixture.debugElement
      .query(By.directive(TemplateTooltipDirective))
      .injector.get(TemplateTooltipDirective);
    expect(directive.tooltipDisabled()).toBe(false);
    expect(directive.contentTemplate()).toBeTruthy();
  });

  it("disables the hover preview tooltip when there are no entries", () => {
    formControl.setValue([]);
    fixture.detectChanges();

    const directive = fixture.debugElement
      .query(By.directive(TemplateTooltipDirective))
      .injector.get(TemplateTooltipDirective);
    expect(directive.tooltipDisabled()).toBe(true);
  });

  it("opens the dialog with the field's formControl, resolved columns and label", () => {
    fixture.componentRef.setInput("entity", new TestEntity());
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
              viewComponent: "DisplayText",
            }),
            expect.objectContaining({
              id: "documentNumber",
              label: "Document Number",
              viewComponent: "DisplayText",
            }),
          ],
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
