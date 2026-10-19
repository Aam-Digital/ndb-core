import { initLanguage } from "./bootstrap-i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";

describe("initLanguage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(window, "fetch");
  });

  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
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
