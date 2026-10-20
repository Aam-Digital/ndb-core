import { initLanguage } from "./bootstrap-i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";

describe("initLanguage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let originalDir: string;
  let originalLang: string;

  beforeEach(() => {
    fetchSpy = vi.spyOn(window, "fetch");
    // the runner is not isolated, so the document has to be handed back unchanged
    originalDir = document.documentElement.dir;
    originalLang = document.documentElement.lang;
  });

  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
    document.documentElement.dir = originalDir;
    document.documentElement.lang = originalLang;
    vi.restoreAllMocks();
  });

  it("should not request translations for the default language", async () => {
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, DEFAULT_LANGUAGE);

    await initLanguage();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should discard a stored locale that is not a valid locale", async () => {
    // a non-string value is stringified by localStorage, which would otherwise
    // be requested from the translations CDN on every reload
    window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "[object Object]");

    await initLanguage();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)).toBe(null);
  });

  it.each([
    ["ar", "rtl"],
    ["ar-EG", "rtl"],
    ["fa", "rtl"],
    ["en-US", "ltr"],
    ["de", "ltr"],
  ])("lays out %s %s", async (locale, expectedDir) => {
    await initLanguage(locale);

    expect(document.documentElement.dir).toBe(expectedDir);
    expect(document.documentElement.lang).toBe(locale);
  });

  it("should still apply the reading direction when translations fail to load", async () => {
    // the layout belongs to the language, not to its translations
    await initLanguage("ar");

    expect(document.documentElement.dir).toBe("rtl");
  });

  it("should leave the document untouched for an invalid locale", async () => {
    document.documentElement.dir = "ltr";

    await initLanguage("[object Object]");

    expect(document.documentElement.dir).toBe("ltr");
  });

  describe("if translations cannot be loaded", () => {
    const originalCdnUrl = environment.translationsCdnUrl;
    const originalVersion = environment.appVersion;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      environment.translationsCdnUrl = "https://cdn.example.com/locale";
      environment.appVersion = "1.2.3";
      window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, "de");
      warnSpy = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      environment.translationsCdnUrl = originalCdnUrl;
      environment.appVersion = originalVersion;
    });

    it("should report it if the CDN responded with an error", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));

      await initLanguage();

      expect(warnSpy).toHaveBeenCalled();
    });

    it("should not report it if the CDN could not be reached (connection problem)", async () => {
      fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

      await initLanguage();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should not report it for a preview build of a pull request", async () => {
      environment.appVersion = "pr-4468";
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));

      await initLanguage();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
