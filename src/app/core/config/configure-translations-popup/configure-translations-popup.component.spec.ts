import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import {
  configureActiveLocale,
  mergeLocaleTranslations,
} from "../../language/active-locale";
import { AVAILABLE_LOCALE_IDS } from "../../language/available-locales";
import { DEFAULT_LANGUAGE } from "../../language/language-statics";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import { availableLocales } from "../../language/languages";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { TranslatableText } from "../multi-lingual-config";
import {
  ConfigureTranslationsDialogData,
  ConfigureTranslationsPopupComponent,
} from "./configure-translations-popup.component";

describe("ConfigureTranslationsPopupComponent", () => {
  let component: ConfigureTranslationsPopupComponent;
  let fixture: ComponentFixture<ConfigureTranslationsPopupComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function createComponent(
    data: ConfigureTranslationsDialogData,
    offeredLocales: ConfigurableEnumValue[] = availableLocales.values,
  ) {
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        ConfigureTranslationsPopupComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: SiteSettingsService,
          useValue: { enabledLocales: signal(offeredLocales) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureTranslationsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function setText(locale: string, text: string) {
    component.rows.find((r) => r.locale === locale).text = text;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    configureActiveLocale(DEFAULT_LANGUAGE, AVAILABLE_LOCALE_IDS);
  });

  it("should create a row for every available language", async () => {
    await createComponent({ value: undefined });

    expect(component.rows.length).toBeGreaterThan(1);
    expect(component.rows.map((r) => r.locale)).toContain("en-US");
    expect(component.rows.map((r) => r.locale)).toContain("de");
  });

  it("should pre-fill each language from an existing translation map", async () => {
    await createComponent({ value: { "en-US": "Name", de: "Vorname" } });

    expect(component.rows.find((r) => r.locale === "en-US").text).toBe("Name");
    expect(component.rows.find((r) => r.locale === "de").text).toBe("Vorname");
    expect(component.rows.find((r) => r.locale === "fr").text).toBe("");
  });

  it("should put an existing plain string into the currently selected language", async () => {
    await createComponent({ value: "Name" });

    expect(component.rows.find((r) => r.locale === "en-US").text).toBe("Name");
    expect(component.rows.find((r) => r.locale === "de").text).toBe("");
  });

  it.each<{
    invariant: string;
    value: TranslatableText | undefined;
    edits: Record<string, string>;
    expected: TranslatableText | undefined;
  }>([
    {
      invariant:
        "return a translation map once several languages are filled in",
      value: "Name",
      edits: { de: "Vorname" },
      expected: { "en-US": "Name", de: "Vorname" },
    },
    {
      invariant:
        "keep a plain string a plain string while only the selected language is filled in",
      value: "Name",
      edits: { "en-US": "Full Name" },
      expected: "Full Name",
    },
    {
      invariant: "ignore languages that only contain whitespace",
      value: "Name",
      edits: { de: "   " },
      expected: "Name",
    },
    {
      invariant: "keep a single non-default translation as a one-entry map",
      value: undefined,
      edits: { de: "Vorname" },
      expected: { de: "Vorname" },
    },
    {
      invariant:
        "keep a map a map when only one language is left, so that the removal can be saved",
      value: { "en-US": "Name", de: "Vorname" },
      edits: { de: "" },
      expected: { "en-US": "Name" },
    },
    {
      invariant: "return no value once every language of a map is cleared",
      value: { "en-US": "Name", de: "Vorname" },
      edits: { "en-US": "", de: "" },
      expected: undefined,
    },
  ])("should $invariant", async ({ value, edits, expected }) => {
    await createComponent({ value });
    for (const [locale, text] of Object.entries(edits)) {
      setText(locale, text);
    }

    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith({ value: expected });
  });

  it.each(["en-US", "de"])(
    "should let a removed translation stay removed once saved, in a %s UI",
    async (uiLocale) => {
      configureActiveLocale(uiLocale, AVAILABLE_LOCALE_IDS);
      const stored = { "en-US": "Name", de: "Vorname" };
      await createComponent({ value: stored });
      setText("de", "");

      component.onSave();

      // what the admin editors do with the result when saving the config
      const [{ value }] = dialogRef.close.mock.calls[0];
      expect(
        mergeLocaleTranslations({ label: stored }, { label: value }),
      ).toEqual({ label: { "en-US": "Name" } });
    },
  );

  it("should treat an existing plain string as the language the admin is editing in", async () => {
    // a German instance whose labels are plain German: adding French must not
    // store the German text as the English translation
    configureActiveLocale("de", AVAILABLE_LOCALE_IDS);
    await createComponent({ value: "Vorname" });

    expect(component.rows.find((r) => r.locale === "de").text).toBe("Vorname");
    expect(component.rows.find((r) => r.locale === "en-US").text).toBe("");

    setText("fr", "Prénom");
    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith({
      value: { de: "Vorname", fr: "Prénom" },
    });
  });

  it("should read a single non-default translation back into its own language", async () => {
    // a plain string would be read back as the default language's text
    await createComponent({ value: { de: "Vorname" } });

    expect(component.rows.find((r) => r.locale === "de").text).toBe("Vorname");
    expect(component.rows.find((r) => r.locale === "en-US").text).toBe("");
  });

  it("should close without a value when cancelled, leaving the config untouched", async () => {
    await createComponent({ value: { "en-US": "Name", de: "Vorname" } });
    setText("de", "changed");

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });

  describe("texts in languages the system does not offer", () => {
    const en = availableLocales.values.find((l) => l.id === "en-US");
    const de = availableLocales.values.find((l) => l.id === "de");

    it.each<{
      name: string;
      value: TranslatableText;
      enOffered: boolean;
      expected: TranslatableText;
    }>(
      [
        { name: "plain string", value: "Name", expected: "Name" },
        {
          name: "map with exact keys",
          value: { "en-US": "Name", de: "Vorname" },
          expected: { "en-US": "Name", de: "Vorname" },
        },
        {
          name: "map with a base-language key",
          value: { en: "Name", de: "Vorname" },
          expected: { "en-US": "Name", de: "Vorname" },
        },
      ].flatMap((c) => [
        { ...c, enOffered: true },
        { ...c, enOffered: false },
      ]),
    )(
      "should keep the existing texts on save: $name, active language offered: $enOffered",
      async ({ value, enOffered, expected }) => {
        configureActiveLocale("en-US", AVAILABLE_LOCALE_IDS);
        await createComponent({ value }, enOffered ? [en, de] : [de]);

        component.onSave();

        expect(dialogRef.close).toHaveBeenCalledWith({ value: expected });
      },
    );

    it("should not offer a row for a language that is neither offered nor translated", async () => {
      await createComponent({ value: { de: "Vorname" } }, [de]);

      expect(component.rows.map((r) => r.locale)).toEqual(["de"]);
    });

    it("should mark rows of languages that are not offered", async () => {
      await createComponent({ value: { "en-US": "Name", de: "Vorname" } }, [
        de,
      ]);

      expect(component.rows.map((r) => [r.locale, r.offered])).toEqual([
        ["de", true],
        ["en-US", false],
      ]);
    });

    function findToggle(): HTMLButtonElement | undefined {
      return Array.from<HTMLButtonElement>(
        fixture.nativeElement.querySelectorAll("button"),
      ).find((b) => /languages? that (is|are) not offered/.test(b.textContent));
    }

    it("should hide rows of languages that are not offered until the toggle is used, and still save them", async () => {
      await createComponent({ value: { "en-US": "Name", de: "Vorname" } }, [
        de,
      ]);

      const labels = () => fixture.nativeElement.textContent;
      expect(labels()).not.toContain("(not offered)");
      expect(findToggle().textContent).toContain(
        "Show 1 more language that is not offered",
      );

      // saving without expanding keeps the hidden translation
      component.onSave();
      expect(dialogRef.close).toHaveBeenCalledWith({
        value: { "en-US": "Name", de: "Vorname" },
      });

      findToggle().click();
      fixture.detectChanges();
      expect(labels()).toContain("(not offered)");
      expect(findToggle().textContent).toContain(
        "Hide 1 language that is not offered",
      );

      findToggle().click();
      fixture.detectChanges();
      expect(labels()).not.toContain("(not offered)");
    });

    it("should not show the toggle if all languages are offered", async () => {
      await createComponent({ value: { "en-US": "Name", de: "Vorname" } });

      expect(findToggle()).toBeUndefined();
    });
  });
});
