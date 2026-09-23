import { TestBed } from "@angular/core/testing";
import { SessionSubject } from "../session/auth/session-info";
import {
  entityRegistry,
  EntityRegistry,
} from "../entity/database-entity.decorator";
import { UserSettingsService } from "./user-settings.service";
import { SiteSettings } from "./site-settings";
import { UserSettings } from "./user-settings";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";

describe("UserSettingsService", () => {
  let service: UserSettingsService;
  let entityMapper: MockEntityMapperService;
  let session: SessionSubject;

  const GERMAN = { id: "de", label: "Deutsch" };

  beforeEach(() => {
    session = new SessionSubject();
    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: SessionSubject, useValue: session },
      ],
    });
    service = TestBed.inject(UserSettingsService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  function login(userId: string) {
    session.next({ id: userId, name: userId, roles: [] } as any);
  }

  it("should have no language before anyone logs in", async () => {
    expect(await service.getLanguage()).toBeUndefined();
  });

  it("should have no language for a user who never chose one", async () => {
    login("user-1");

    expect(await service.getLanguage()).toBeUndefined();
  });

  it("should store the language under the user's own account id", async () => {
    login("user-1");

    await service.setLanguage(GERMAN);

    const saved = entityMapper.get(
      UserSettings.ENTITY_TYPE,
      "user-1",
    ) as UserSettings;
    expect(saved.defaultLanguage).toEqual(GERMAN);
    expect(await service.getLanguage()).toBe("de");
  });

  it("should keep each user's language separate", async () => {
    login("user-1");
    await service.setLanguage(GERMAN);

    login("user-2");

    expect(await service.getLanguage()).toBeUndefined();
  });

  it("should not touch the global settings document", async () => {
    login("user-1");

    await service.setLanguage(GERMAN);

    // a separate entity type, so a user's own settings can never be granted
    // write access to the site branding
    expect(() =>
      entityMapper.get(SiteSettings.ENTITY_TYPE, SiteSettings.ENTITY_ID),
    ).toThrowError();
    expect(() =>
      entityMapper.get(SiteSettings.ENTITY_TYPE, "user-1"),
    ).toThrowError();
  });

  it("should store only the language, not any site branding defaults", async () => {
    login("user-1");

    await service.setLanguage(GERMAN);

    const saved = entityMapper.get(UserSettings.ENTITY_TYPE, "user-1");
    // the entity type carries no branding fields at all, so none of the
    // SiteSettings class defaults can end up in a user's personal document
    for (const brandingField of [
      "siteName",
      "hideSiteNameInToolbar",
      "displayLanguageSelect",
      "dateFormat",
    ]) {
      expect(Object.keys(saved)).not.toContain(brandingField);
    }
  });

  it("should refuse to save without a logged-in user", async () => {
    await expect(service.setLanguage(GERMAN)).rejects.toThrow();
  });
});
