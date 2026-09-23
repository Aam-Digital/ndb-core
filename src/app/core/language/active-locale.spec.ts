import {
  configureActiveLocale,
  resolveActiveConfig,
  resolveActiveText,
} from "./active-locale";
import { AVAILABLE_LOCALE_IDS } from "./available-locales";
import { DEFAULT_LANGUAGE } from "./language-statics";

describe("active-locale", () => {
  afterEach(() => {
    configureActiveLocale(DEFAULT_LANGUAGE, AVAILABLE_LOCALE_IDS);
  });

  describe("resolveActiveText", () => {
    it("returns a plain string unchanged", () => {
      configureActiveLocale("de", AVAILABLE_LOCALE_IDS);

      expect(resolveActiveText("Name")).toBe("Name");
    });

    it("resolves a translation map to the active locale", () => {
      configureActiveLocale("de", AVAILABLE_LOCALE_IDS);

      expect(resolveActiveText({ "en-US": "Name", de: "Vorname" })).toBe(
        "Vorname",
      );
    });

    it("falls back to the default language when the active one is missing", () => {
      configureActiveLocale("fr", AVAILABLE_LOCALE_IDS);

      expect(resolveActiveText({ "en-US": "Name", de: "Vorname" })).toBe(
        "Name",
      );
    });

    it("returns undefined for a missing value", () => {
      expect(resolveActiveText(undefined)).toBeUndefined();
    });

    it("resolves with the app's locales even before configureActiveLocale ran", () => {
      // defaults matter for unit tests, the CLI and e2e fixtures
      expect(resolveActiveText({ "en-US": "Name", de: "Vorname" })).toBe(
        "Name",
      );
    });

    it("leaves values that are not translation maps untouched", () => {
      const date = new Date("2025-01-31");

      expect(resolveActiveText(date)).toBe(date);
      expect(resolveActiveText({ label: "FromLabel" })).toEqual({
        label: "FromLabel",
      });
    });
  });

  describe("resolveActiveConfig", () => {
    it("resolves nested maps, including inside arrays", () => {
      configureActiveLocale("de", AVAILABLE_LOCALE_IDS);
      const raw = {
        title: { "en-US": "Progress", de: "Fortschritt" },
        parts: [
          { label: { "en-US": "Schools", de: "Schulen" }, currentValue: 1 },
          { label: "Unchanged", currentValue: 2 },
        ],
      };

      expect(resolveActiveConfig(raw)).toEqual({
        title: "Fortschritt",
        parts: [
          { label: "Schulen", currentValue: 1 },
          { label: "Unchanged", currentValue: 2 },
        ],
      });
    });

    it("does not mutate the input, so the raw value stays saveable", () => {
      configureActiveLocale("de", AVAILABLE_LOCALE_IDS);
      const raw = { title: { "en-US": "Progress", de: "Fortschritt" } };

      resolveActiveConfig(raw);

      expect(raw.title).toEqual({ "en-US": "Progress", de: "Fortschritt" });
    });
  });
});
