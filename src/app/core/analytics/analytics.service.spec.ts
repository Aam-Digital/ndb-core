import { TestBed } from "@angular/core/testing";

import { AnalyticsService } from "./analytics.service";
import {
  Angulartics2,
  Angulartics2Matomo,
  Angulartics2Module,
} from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfigService } from "../config/config.service";
import { UsageAnalyticsConfig } from "./usage-analytics-config";
import { Subject } from "rxjs";
import { Config } from "../config/config";
import { SiteSettingsService } from "../site-settings/site-settings.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  const configUpdates = new Subject();
  let mockMatomo: jasmine.SpyObj<Angulartics2Matomo>;
  let mockAngulartics: jasmine.SpyObj<Angulartics2>;
  let siteNameSubject = new Subject();

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(
      "mockConfigService",
      ["getConfig"],
      { configUpdates: configUpdates },
    );
    mockMatomo = jasmine.createSpyObj("mockMatomo", [
      "setUsername",
      "startTracking",
    ]);
    mockAngulartics = jasmine.createSpyObj([], {
      setUserProperties: { next: jasmine.createSpy() },
    });

    TestBed.configureTestingModule({
      imports: [Angulartics2Module.forRoot(), RouterTestingModule],
      providers: [
        AnalyticsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Angulartics2Matomo, useValue: mockMatomo },
        { provide: Angulartics2, useValue: mockAngulartics },
        {
          provide: SiteSettingsService,
          useValue: { siteName: siteNameSubject },
        },
      ],
    });
    service = TestBed.inject(AnalyticsService);

    // make _paq a array
    window["_paq"] = [];
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // TODO these tests currently dont work because init is called before config is loaded
  xit("should not track if no url or site_id", () => {
    mockConfigService.getConfig.and.returnValue({});
    service.init();
    expect(mockMatomo.startTracking).not.toHaveBeenCalled();
  });

  xit("should not track if no usage analytics config", () => {
    mockConfigService.getConfig.and.returnValue(undefined);
    service.init();
    expect(mockMatomo.startTracking).not.toHaveBeenCalled();
  });

  it("should start tracking after calling init and config is loaded", () => {
    service.init();
    configUpdates.next(new Config());

    expect(mockMatomo.startTracking).toHaveBeenCalled();
  });

  it("should track correct site_id after updated config", () => {
    const testAnalyticsConfig: UsageAnalyticsConfig = {
      site_id: "101",
      url: "test-endpoint",
    };
    mockConfigService.getConfig.and.returnValue(testAnalyticsConfig);
    service.init();

    configUpdates.next(new Config());

    expect(window["_paq"]).toContain([
      "setSiteId",
      testAnalyticsConfig.site_id,
    ]);
  });

  it("should set tracker url with or without trailing slash", () => {
    window["_paq"] = [];
    const testAnalyticsConfig: UsageAnalyticsConfig = {
      site_id: "101",
      url: "test-endpoint",
    };
    service.init();
    mockConfigService.getConfig.and.returnValue(testAnalyticsConfig);
    configUpdates.next(new Config());

    expect(window["_paq"]).toContain([
      "setTrackerUrl",
      testAnalyticsConfig.url + "/matomo.php",
    ]);

    window["_paq"] = [];
    const testAnalyticsConfig2: UsageAnalyticsConfig = {
      site_id: "101",
      url: "test-endpoint/",
    };
    mockConfigService.getConfig.and.returnValue(testAnalyticsConfig2);
    configUpdates.next(new Config());

    expect(window["_paq"]).toContain([
      "setTrackerUrl",
      testAnalyticsConfig2.url + "matomo.php",
    ]);
  });

  it("should set the hostname as the organisation", () => {
    service.init();

    expect(mockAngulartics.setUserProperties.next).toHaveBeenCalledWith({
      dimension2: location.hostname,
    });
  });
});
