import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AdminDisplayConditionButtonComponent } from "./admin-display-condition-button.component";
import { ConditionEditorDialogComponent } from "../../../common-components/condition-editor-dialog/condition-editor-dialog.component";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("AdminDisplayConditionButtonComponent", () => {
  let fixture: ComponentFixture<AdminDisplayConditionButtonComponent>;
  let openDialog: ReturnType<typeof vi.fn>;
  let emitted: unknown[];

  function setup(inputs: Record<string, unknown>, dialogResult?: unknown) {
    openDialog = vi.fn().mockReturnValue(mockMatDialogRef(dialogResult));
    TestBed.configureTestingModule({
      imports: [
        AdminDisplayConditionButtonComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: MatDialog, useValue: { open: openDialog } }],
    });
    fixture = TestBed.createComponent(AdminDisplayConditionButtonComponent);
    emitted = [];
    fixture.componentInstance.conditionChange.subscribe((c) => emitted.push(c));
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  }

  const button = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector("button");

  it.each([
    { condition: undefined, accent: false },
    { condition: null, accent: false },
    { condition: { name: "x" }, accent: true },
  ])(
    "should only highlight the button in the accent color while a condition is configured (condition: $condition)",
    ({ condition, accent }) => {
      setup({ target: "field", condition });

      expect(button().classList.contains("mat-accent")).toBe(accent);
    },
  );

  it.each([
    {
      showLabel: false,
      condition: undefined,
      name: "Create Display Condition",
      text: "",
    },
    {
      showLabel: false,
      condition: { name: "x" },
      name: "Edit Display Condition",
      text: "",
    },
    {
      showLabel: true,
      condition: undefined,
      name: "Create Display Condition",
      text: "Create Display Condition",
    },
    {
      showLabel: true,
      condition: { name: "x" },
      name: "Edit Display Condition",
      text: "Edit Display Condition",
    },
  ])(
    "should name the action by whether a condition exists, and show it as text only if requested (showLabel: $showLabel, condition: $condition)",
    ({ showLabel, condition, name, text }) => {
      setup({ target: "field", showLabel, condition });

      expect(button().textContent.trim()).toBe(text);
      expect(
        button().getAttribute("aria-label") ?? button().textContent.trim(),
      ).toBe(name);
    },
  );

  it("should open the editor with the entity type and current condition", () => {
    const condition = { $or: [{ name: "shown" }] };
    setup({ target: "fieldGroup", entityType: TestEntity, condition });

    button().click();

    expect(openDialog).toHaveBeenCalledWith(
      ConditionEditorDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          entityConstructor: TestEntity,
          conditions: condition,
          explanation: expect.stringContaining("field group"),
        }),
      }),
    );
  });

  it.each([
    { dialogResult: { name: "x" }, expected: [{ name: "x" }] },
    { dialogResult: null, expected: [null] },
    // `undefined` means the dialog was cancelled
    { dialogResult: undefined, expected: [] },
  ])(
    "should emit the condition chosen in the editor, but nothing if cancelled (dialog result: $dialogResult)",
    ({ dialogResult, expected }) => {
      setup({ target: "field", condition: { name: "old" } }, dialogResult);

      button().click();

      expect(emitted).toEqual(expected);
    },
  );
});
