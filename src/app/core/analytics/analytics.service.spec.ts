import { TestBed } from "@angular/core/testing";

import { AnalyticsService } from "./analytics.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfigService } from "../config/config.service";
import { UsageAnalyticsConfig } from "./usage-analytics-config";
import { Angulartics2Matomo } from "angulartics2/matomo";
import { AppConfig } from "../app-config/app-config";
import { IAppConfig } from "../app-config/app-config.model";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockMatomo: jasmine.SpyObj<Angulartics2Matomo>;

  beforeEach(() => {
    AppConfig.settings = { site_name: "unit-testing" } as IAppConfig;
    mockConfigService = jasmine.createSpyObj("mockConfigService", [
      "getConfig",
    ]);
    mockMatomo = jasmine.createSpyObj("mockMatomo", [
      "setUsername",
      "startTracking",
    ]);

    TestBed.configureTestingModule({
      imports: [Angulartics2Module.forRoot(), RouterTestingModule],
      providers: [
        AnalyticsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Angulartics2Matomo, useValue: mockMatomo },
      ],
    });
    service = TestBed.inject(AnalyticsService);

    // make _paq a array
    window["_paq"] = [];
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should not track if no url or site_id", () => {
    mockConfigService.getConfig.and.returnValue({});
    service.init();
    expect(mockMatomo.startTracking).not.toHaveBeenCalled();
  });

  it("should not track if no usage analytics config", () => {
    mockConfigService.getConfig.and.returnValue(undefined);
    service.init();
    expect(mockMatomo.startTracking).not.toHaveBeenCalled();
  });

  it("should track correct site_id", () => {
    const testAnalyticsConfig: UsageAnalyticsConfig = {
      site_id: "101",
      url: "test-endpoint",
    };
    mockConfigService.getConfig.and.returnValue(testAnalyticsConfig);

    service.init();

    expect(mockMatomo.startTracking).toHaveBeenCalledTimes(1);
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
    mockConfigService.getConfig.and.returnValue(testAnalyticsConfig);
    service.init();
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
    service.init();
    expect(window["_paq"]).toContain([
      "setTrackerUrl",
      testAnalyticsConfig2.url + "matomo.php",
    ]);
  });
});
