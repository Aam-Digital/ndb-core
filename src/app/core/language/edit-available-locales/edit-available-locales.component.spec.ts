import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { environment } from "#src/environments/environment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { LOCALE_ENUM_ID } from "../languages";
import { EditAvailableLocalesComponent } from "./edit-available-locales.component";

describe("EditAvailableLocalesComponent", () => {
  const DE = { id: "de", label: "German" };
  const FR = { id: "fr", label: "French" };
  const originalFlag = environment.multiLingualConfigEnabled;
  let fixture: ComponentFixture<EditAvailableLocalesComponent>;
  let form: FormGroup;

  function create(flag: boolean, offered: unknown[]) {
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
      availableLocales: new FormControl(offered),
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
      expect(el.querySelectorAll("app-edit-configurable-enum")).toHaveLength(
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

  it("should re-add the system language if it is removed", () => {
    create(true, [FR, DE]);

    form.get("availableLocales").setValue([FR]);

    expect(form.value.availableLocales).toEqual([FR, DE]);
  });
});
