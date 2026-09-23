import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of } from "rxjs";

import { TranslatableTextInputComponent } from "./translatable-text-input.component";

describe("TranslatableTextInputComponent", () => {
  let component: TranslatableTextInputComponent;
  let fixture: ComponentFixture<TranslatableTextInputComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        TranslatableTextInputComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslatableTextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** simulate saving the translations dialog with the given value */
  function saveDialogWith(value: unknown) {
    closeDialogWith({ value });
  }

  /** simulate the dialog closing with a raw result (undefined = cancelled) */
  function closeDialogWith(result: unknown) {
    mockDialog.open.mockReturnValue({ afterClosed: () => of(result) });
    component.openTranslations({ stopPropagation: () => undefined } as Event);
  }

  it("should show the active language's text for a multi-lingual value", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    // tests run in the default language
    expect(component.displayText()).toBe("Name");
    expect(component.isMultiLingual()).toBe(true);
  });

  it("should show a plain string as-is", () => {
    component.value = "Name";

    expect(component.displayText()).toBe("Name");
    expect(component.isMultiLingual()).toBe(false);
  });

  it("should keep other languages when the text field is edited", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    component.onTextInput("Full Name");

    expect(component.value).toEqual({ "en-US": "Full Name", de: "Vorname" });
  });

  it("falls back to another language when the active one has no slot yet", () => {
    component.value = { de: "Vorname" };

    expect(component.displayText()).toBe("Vorname");
  });

  it("clears the field when the active language's text is deleted", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    component.onTextInput("");

    expect(component.value).toEqual({ "en-US": "", de: "Vorname" });
    // must not fall back to another language, or the admin cannot clear it
    expect(component.displayText()).toBe("");
  });

  it("should keep a plain string plain when the text field is edited", () => {
    component.value = "Name";

    component.onTextInput("Full Name");

    expect(component.value).toBe("Full Name");
  });

  it("should take the value configured in the translations dialog", () => {
    component.value = "Name";

    saveDialogWith({ "en-US": "Name", de: "Vorname" });

    expect(component.value).toEqual({ "en-US": "Name", de: "Vorname" });
  });

  it("clears the value when every translation is removed in the dialog", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    saveDialogWith(undefined);

    expect(component.value).toBeUndefined();
  });

  it("should keep the previous value when the dialog is cancelled", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    closeDialogWith(undefined);

    expect(component.value).toEqual({ "en-US": "Name", de: "Vorname" });
  });

  describe("when used as an edit component (onChange not registered)", () => {
    let formControl: FormControl;

    beforeEach(() => {
      formControl = new FormControl<any>("Attendance Report");
      component.ngControl = { control: formControl } as any;
    });

    it("writes text typed in the field to the bound form control", () => {
      component.value = "Attendance Report";

      component.onTextInput("Anwesenheitsbericht");

      expect(formControl.value).toBe("Anwesenheitsbericht");
      expect(formControl.dirty).toBe(true);
    });

    it("writes the translations dialog result to the bound form control", () => {
      component.value = "Attendance Report";

      saveDialogWith({
        "en-US": "Attendance Report",
        de: "Anwesenheitsbericht",
      });

      expect(formControl.value).toEqual({
        "en-US": "Attendance Report",
        de: "Anwesenheitsbericht",
      });
    });
  });
});
