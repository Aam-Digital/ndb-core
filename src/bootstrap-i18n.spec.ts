import { initLanguage } from "./bootstrap-i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";

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
});
