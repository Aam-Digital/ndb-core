import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of } from "rxjs";

import { TranslatableTextInputComponent } from "./translatable-text-input.component";

describe("TranslatableTextInputComponent", () => {
  let component: TranslatableTextInputComponent;
  let fixture: ComponentFixture<TranslatableTextInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslatableTextInputComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslatableTextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** simulate the translations dialog being confirmed with the given result */
  function confirmDialogWith(result: unknown) {
    vi.spyOn(component["dialog"], "open").mockReturnValue({
      afterClosed: () => of(result),
    } as any);
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

  it("should stay empty when the active language's text is cleared", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    component.onTextInput("");

    // must not fall back to another language, or the field cannot be cleared
    expect(component.displayText()).toBe("");
    expect(component.value).toEqual({ "en-US": "", de: "Vorname" });
  });

  it("should show another language as a starting point when the active one is missing", () => {
    component.value = { de: "Vorname" };

    expect(component.displayText()).toBe("Vorname");
  });

  it("should keep other languages when the text field is edited", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    component.onTextInput("Full Name");

    expect(component.value).toEqual({ "en-US": "Full Name", de: "Vorname" });
  });

  it("should keep a plain string plain when the text field is edited", () => {
    component.value = "Name";

    component.onTextInput("Full Name");

    expect(component.value).toBe("Full Name");
  });

  it("should take the value configured in the translations dialog", () => {
    component.value = "Name";

    confirmDialogWith({ "en-US": "Name", de: "Vorname" });

    expect(component.value).toEqual({ "en-US": "Name", de: "Vorname" });
  });

  it("should keep the previous value when the dialog is cancelled", () => {
    component.value = { "en-US": "Name", de: "Vorname" };

    confirmDialogWith(undefined);

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

      confirmDialogWith({
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
