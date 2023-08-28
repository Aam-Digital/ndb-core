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

  it("should reset favicon when deleted", fakeAsync(() => {
    const siteSettings = new SiteSettings();
    siteSettings.favicon = "some.icon";
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
});
