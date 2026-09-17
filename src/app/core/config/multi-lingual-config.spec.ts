import {
  isTranslatableText,
  mergeTranslatableValues,
  resolveTranslatableConfig,
  resolveTranslatableText,
} from "./multi-lingual-config";

describe("multi-lingual-config", () => {
  // mirrors the app's real locale ids (see languages.ts): en-US, de, fr
  const LOCALES = ["en-US", "de", "fr"];
  const DEFAULT = "en-US";

  describe("isTranslatableText", () => {
    it("detects a proper translation map (all keys locales, all values strings)", () => {
      expect(
        isTranslatableText({ "en-US": "Name", de: "Vorname" }, LOCALES),
      ).toBe(true);
    });

    it("rejects a plain string", () => {
      expect(isTranslatableText("Name", LOCALES)).toBe(false);
    });

    it("rejects null, arrays and empty objects", () => {
      expect(isTranslatableText(null, LOCALES)).toBe(false);
      expect(isTranslatableText(["en-US"], LOCALES)).toBe(false);
      expect(isTranslatableText({}, LOCALES)).toBe(false);
    });

    it("rejects an object with a non-locale key", () => {
      expect(
        isTranslatableText({ "en-US": "Name", component: "X" }, LOCALES),
      ).toBe(false);
    });

    it("rejects an object with a non-string value (e.g. nested config)", () => {
      expect(
        isTranslatableText({ "en-US": { dataType: "string" } }, LOCALES),
      ).toBe(false);
    });

    it("rejects a map whose keys are not in the configured locales", () => {
      // "en" is not a configured locale id (the app uses "en-US")
      expect(isTranslatableText({ en: "Name", de: "Vorname" }, LOCALES)).toBe(
        false,
      );
    });
  });

  describe("resolveTranslatableText", () => {
    it("returns a plain string unchanged", () => {
      expect(resolveTranslatableText("Name", "de", DEFAULT, LOCALES)).toBe(
        "Name",
      );
    });

    it("returns undefined for null/undefined", () => {
      expect(
        resolveTranslatableText(undefined, "de", DEFAULT, LOCALES),
      ).toBeUndefined();
      expect(
        resolveTranslatableText(null, "de", DEFAULT, LOCALES),
      ).toBeUndefined();
    });

    it("resolves the exact active locale", () => {
      const value = { "en-US": "Name", de: "Vorname" };
      expect(resolveTranslatableText(value, "de", DEFAULT, LOCALES)).toBe(
        "Vorname",
      );
    });

    it("falls back to the default locale when the active locale is missing", () => {
      const value = { "en-US": "Name", de: "Vorname" };
      expect(resolveTranslatableText(value, "fr", DEFAULT, LOCALES)).toBe(
        "Name",
      );
    });

    it("falls back to the first non-empty value when neither active nor default match", () => {
      const value = { de: "Vorname", fr: "Prénom" };
      expect(resolveTranslatableText(value, "es", "es", LOCALES)).toBe(
        "Vorname",
      );
    });

    it("matches by language subtag across region variants (en-GB -> en-US)", () => {
      const regionLocales = ["en-US", "en-GB", "de"];
      const value = { "en-US": "Color", de: "Farbe" };
      expect(
        resolveTranslatableText(value, "en-GB", "en-US", regionLocales),
      ).toBe("Color");
    });

    it("skips an empty-string slot and falls back", () => {
      const value = { "en-US": "Name", de: "" };
      expect(resolveTranslatableText(value, "de", DEFAULT, LOCALES)).toBe(
        "Name",
      );
    });
  });

  describe("mergeTranslatableValues", () => {
    it("keeps the full translation map when the admin did not change the text", () => {
      const raw = {
        dataType: "string",
        label: { "en-US": "Name", de: "Vorname" },
      };
      // what an en-US admin was shown and saved back unchanged
      const edited = { dataType: "string", label: "Name" };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toEqual({ "en-US": "Name", de: "Vorname" });
    });

    it("updates only the active locale when the admin changed the text", () => {
      const raw = { label: { "en-US": "Name", de: "Vorname" } };
      const edited = { label: "Full Name" };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toEqual({ "en-US": "Full Name", de: "Vorname" });
    });

    it("adds a translation for the active locale when it was missing (edited via fallback)", () => {
      const raw = { label: { "en-US": "Name" } };
      // a French admin saw the en-US fallback and typed the French text
      const edited = { label: "Nom" };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "fr",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toEqual({ "en-US": "Name", fr: "Nom" });
    });

    it("keeps plain strings as plain strings (configs that never opted in)", () => {
      const raw = { label: "Name" };
      const edited = { label: "Full Name" };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toBe("Full Name");
    });

    it("carries over non-translatable properties from the edited value", () => {
      const raw = {
        dataType: "string",
        label: { "en-US": "Name", de: "Vorname" },
      };
      const edited = { dataType: "long-text", label: "Name" };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.dataType).toBe("long-text");
      expect(merged.label).toEqual({ "en-US": "Name", de: "Vorname" });
    });

    it("keeps a map that was edited directly as a map (translations dialog)", () => {
      const raw = { label: { "en-US": "Name", de: "Vorname" } };
      const edited = { label: { "en-US": "Name", de: "Nachname", fr: "Nom" } };

      const merged = mergeTranslatableValues(
        raw,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toEqual({
        "en-US": "Name",
        de: "Nachname",
        fr: "Nom",
      });
    });

    it("handles a missing raw counterpart (newly added field)", () => {
      const edited = { label: "New Field" };

      const merged = mergeTranslatableValues(
        undefined,
        edited,
        "en-US",
        DEFAULT,
        LOCALES,
      );

      expect(merged.label).toBe("New Field");
    });
  });

  describe("resolveTranslatableConfig", () => {
    it("resolves nested maps and leaves ids and non-translatable objects untouched", () => {
      const raw = {
        "entity:Child": {
          label: { "en-US": "Child", de: "Kind" },
          attributes: {
            name: {
              dataType: "string",
              label: { "en-US": "Name", de: "Vorname" },
            },
          },
        },
        "view:child": {
          component: "EntityList",
          config: { title: { "en-US": "Children", de: "Kinder" } },
        },
      };

      const resolved = resolveTranslatableConfig(raw, "de", DEFAULT, LOCALES);

      expect(resolved).toEqual({
        "entity:Child": {
          label: "Kind",
          attributes: {
            name: { dataType: "string", label: "Vorname" },
          },
        },
        "view:child": {
          component: "EntityList",
          config: { title: "Kinder" },
        },
      });
    });

    it("resolves maps inside arrays", () => {
      const raw = {
        items: [{ label: { "en-US": "One", de: "Eins" } }, { label: "Two" }],
      };

      const resolved = resolveTranslatableConfig(raw, "de", DEFAULT, LOCALES);

      expect(resolved).toEqual({
        items: [{ label: "Eins" }, { label: "Two" }],
      });
    });

    it("does not mutate the input (raw stays the source of truth)", () => {
      const raw = { label: { "en-US": "Name", de: "Vorname" } };

      const resolved = resolveTranslatableConfig(raw, "de", DEFAULT, LOCALES);

      expect(resolved.label).toBe("Vorname");
      expect(raw.label).toEqual({ "en-US": "Name", de: "Vorname" });
    });
  });
});
