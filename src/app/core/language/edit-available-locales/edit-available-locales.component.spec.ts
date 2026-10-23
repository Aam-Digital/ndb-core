import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { environment } from "#src/environments/environment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { availableLocales, LOCALE_ENUM_ID } from "../languages";
import { EditAvailableLocalesComponent } from "./edit-available-locales.component";
import { By } from "@angular/platform-browser";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";

describe("EditAvailableLocalesComponent", () => {
  const DE = { id: "de", label: "German" };
  const FR = { id: "fr", label: "French" };
  const originalFlag = environment.multiLingualConfigEnabled;
  let fixture: ComponentFixture<EditAvailableLocalesComponent>;
  let form: FormGroup;

  function create(flag: boolean, enabled: unknown[]) {
    environment.multiLingualConfigEnabled = flag;
    TestBed.configureTestingModule({
      imports: [
        EditAvailableLocalesComponent,
        MockedTestingModule.withState(),
        NoopAnimationsModule,
      ],
      providers: [{ provide: NAVIGATOR_TOKEN, useValue: { onLine: true } }],
    });
    form = new FormGroup({
      defaultLanguage: new FormControl(DE),
      availableLocales: new FormControl(enabled),
    });
    fixture = TestBed.createComponent(EditAvailableLocalesComponent);
    fixture.componentInstance.ngControl = {
      control: form.get("availableLocales"),
    } as any;
    fixture.componentRef.setInput("formFieldConfig", {
      id: "availableLocales",
      isArray: true,
      additional: LOCALE_ENUM_ID,
    });
    fixture.detectChanges();
  }

  afterEach(() => {
    environment.multiLingualConfigEnabled = originalFlag;
  });

  it.each([
    [true, 0, 1],
    [false, 1, 0],
  ])(
    "with the flag %s should show %s feature-disabled infos and %s selects",
    (flag, infos, selects) => {
      create(flag, []);

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll("app-feature-disabled-info")).toHaveLength(
        infos,
      );
      expect(el.querySelectorAll("app-basic-autocomplete")).toHaveLength(
        selects,
      );
    },
  );

  it.each([
    ["adds a missing system language", [FR], [FR, DE]],
    ["keeps an empty list (all languages) empty", [], []],
  ])("should %s to a stored list", (_, stored, expected) => {
    create(true, stored);

    expect(form.value.availableLocales).toEqual(expected);
  });

  it("should mark only the system language chip with an explanation", async () => {
    create(true, [FR, DE]);
    await fixture.whenStable();
    fixture.detectChanges();

    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll("mat-chip-row, mat-chip"),
    );
    const marked = chips.filter((chip) =>
      chip.querySelector(".system-language-marker"),
    );
    expect(chips).toHaveLength(2);
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent).toContain("Deutsch / German (de)");
    expect(marked[0].textContent).toContain("system language");
  });

  it("should store the same value format as the enum select", () => {
    create(true, [FR]);
    const component = fixture.componentInstance;

    const option = component.options.find(({ id }) => id === "de");
    expect(option).toEqual(
      expect.objectContaining({ id: "de", label: "Deutsch / German (de)" }),
    );
    expect(component.options.map(({ id }) => id)).toEqual(
      availableLocales.values.map(({ id }) => id),
    );
  });

  it("opens the options to pick from when the form field is clicked", () => {
    create(true, [DE]);
    const autocomplete = fixture.debugElement.query(
      By.directive(BasicAutocompleteComponent),
    ).componentInstance as BasicAutocompleteComponent<unknown, unknown>;
    const showAutocomplete = vi.spyOn(autocomplete, "showAutocomplete");

    fixture.componentInstance.onContainerClick(new MouseEvent("click"));

    expect(showAutocomplete).toHaveBeenCalled();
  });

  it("should re-add the system language if it is removed", () => {
    create(true, [FR, DE]);

    form.get("availableLocales").setValue([FR]);

    expect(form.value.availableLocales).toEqual([FR, DE]);
  });
});
