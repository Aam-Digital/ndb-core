import { ComponentFixture, TestBed } from "@angular/core/testing";
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
});
