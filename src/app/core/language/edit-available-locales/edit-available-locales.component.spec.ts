import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { environment } from "#src/environments/environment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { availableLocales, LOCALE_ENUM_ID } from "../languages";
import { EditAvailableLocalesComponent } from "./edit-available-locales.component";

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
    ["add a missing default language", [FR], [FR, DE]],
    ["add the default language to an empty list", [], [DE]],
  ])("should %s on init", (_, stored, expected) => {
    create(true, stored);

    expect(form.value.availableLocales).toEqual(expected);
  });

  it("should mark only the default language chip with an explanation", async () => {
    create(true, [FR, DE]);
    await fixture.whenStable();
    fixture.detectChanges();

    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll("mat-chip-row, mat-chip"),
    );
    const marked = chips.filter((chip) =>
      chip.querySelector(".default-language-marker"),
    );
    expect(chips).toHaveLength(2);
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent).toContain("Deutsch / German (de)");
    expect(marked[0].textContent).toContain("default language");
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

  it("opens the options to pick from when clicking anywhere in the field", async () => {
    create(true, [DE]);
    const field = fixture.nativeElement.querySelector(
      "app-basic-autocomplete",
    ) as HTMLElement;

    field.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(
      1,
    );
  });

  it("should add a changed default language to the list", () => {
    create(true, [DE]);

    form.get("defaultLanguage").setValue(FR);

    expect(form.value.availableLocales).toEqual([DE, FR]);
  });

  it("should leave only the default language if everything else is removed", () => {
    create(true, [FR, DE]);

    form.get("availableLocales").setValue([]);

    expect(form.value.availableLocales).toEqual([DE]);
  });

  it("should re-add the default language if it is removed", () => {
    create(true, [FR, DE]);

    form.get("availableLocales").setValue([FR]);

    expect(form.value.availableLocales).toEqual([FR, DE]);
  });
});
