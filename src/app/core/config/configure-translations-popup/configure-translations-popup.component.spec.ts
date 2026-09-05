import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import {
  ConfigureTranslationsDialogData,
  ConfigureTranslationsPopupComponent,
} from "./configure-translations-popup.component";

describe("ConfigureTranslationsPopupComponent", () => {
  let component: ConfigureTranslationsPopupComponent;
  let fixture: ComponentFixture<ConfigureTranslationsPopupComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function createComponent(data: ConfigureTranslationsDialogData) {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureTranslationsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function setText(locale: string, text: string) {
    component.rows.find((r) => r.locale === locale).text = text;
  }

  afterEach(() => TestBed.resetTestingModule());

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

  it("should put an existing plain string into the default language", async () => {
    await createComponent({ value: "Name" });

    expect(component.rows.find((r) => r.locale === "en-US").text).toBe("Name");
    expect(component.rows.find((r) => r.locale === "de").text).toBe("");
  });

  it("should return a translation map once several languages are filled in", async () => {
    await createComponent({ value: "Name" });
    setText("de", "Vorname");

    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith({
      "en-US": "Name",
      de: "Vorname",
    });
  });

  it("should return a plain string while only one language is filled in", async () => {
    await createComponent({ value: { "en-US": "Name", de: "Vorname" } });
    setText("de", "");

    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith("Name");
  });

  it("should ignore languages that only contain whitespace", async () => {
    await createComponent({ value: "Name" });
    setText("de", "   ");

    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith("Name");
  });

  it("should close without a value when cancelled, leaving the config untouched", async () => {
    await createComponent({ value: { "en-US": "Name", de: "Vorname" } });
    setText("de", "changed");

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
