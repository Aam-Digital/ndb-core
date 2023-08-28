import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SiteSettingsService } from "./site-settings.service";
import { FileService } from "../../features/file/file.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity/entity-mapper/mock-entity-mapper-service";
import { SiteSettings } from "./site-settings";
import { of } from "rxjs";
import { Title } from "@angular/platform-browser";

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;
  let entityMapper: MockEntityMapperService;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(() => {
    entityMapper = mockEntityMapper();
    mockFileService = jasmine.createSpyObj(["loadFile"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: FileService, useValue: mockFileService },
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    });
    service = TestBed.inject(SiteSettingsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should only publish changes if property has changed", () => {
    const titleSpy = spyOn(TestBed.inject(Title), "setTitle");
    const settings = SiteSettings.create({ siteName: undefined });

    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.displayLanguageSelect = false;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.siteName = "New name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();

    titleSpy.calls.reset();
    settings.displayLanguageSelect = true;
    entityMapper.add(settings);

    expect(titleSpy).not.toHaveBeenCalled();

    settings.displayLanguageSelect = false;
    settings.siteName = "Another new name";
    entityMapper.add(settings);

    expect(titleSpy).toHaveBeenCalled();
  });

  it("should reset favicon when deleted", fakeAsync(() => {
    const siteSettings = SiteSettings.create({ favicon: "some.icon" });
    mockFileService.loadFile.and.returnValue(of({ url: "icon.url" }));
    const mockIconEl = { href: "initial" };
    spyOn(document, "querySelector").and.returnValue(mockIconEl as any);
    entityMapper.add(siteSettings);
    tick();

    expect(mockFileService.loadFile).toHaveBeenCalledWith(
      siteSettings,
      "favicon",
    );
    expect(mockIconEl.href).toBe("icon.url");

    mockFileService.loadFile.calls.reset();
    delete siteSettings.favicon;
    entityMapper.add(siteSettings);
    tick();

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(mockIconEl.href).toBe("favicon.ico");
  }));

  it("should set font family once defined", () => {
    spyOn(document.documentElement.style, "setProperty");

    entityMapper.add(SiteSettings.create({ font: "comic sans" }));

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--font-family",
      "comic sans",
    );
  });

  it("should update the color palette if a color is changed", () => {
    spyOn(document.documentElement.style, "setProperty");

    entityMapper.add(SiteSettings.create({ primary: "#ffffff" }));

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--primary-50",
      "#ffffff",
    );
  });
});
