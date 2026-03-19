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
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../config/config";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { LoginStateSubject } from "../session/session-type";
import { SessionSubject } from "../session/auth/session-info";
import { LoginState } from "../session/session-states/login-state.enum";
import type { Mock } from "vitest";

type ConfigServiceMock = {
  getConfig: Mock;
  configUpdates: Subject<Config>;
};

type MatomoMock = {
  setUsername: Mock;
  startTracking: Mock;
};

type AngularticsMock = {
  setUserProperties: { next: Mock };
};

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  let mockConfigService: ConfigServiceMock;
  const configUpdates = new Subject<Config>();
  let mockMatomo: MatomoMock;
  let mockAngulartics: AngularticsMock;
  const siteNameSubject = new Subject<string>();

  beforeEach(() => {
    mockConfigService = {
      getConfig: vi.fn().mockName("mockConfigService.getConfig"),
      configUpdates,
    };
    mockMatomo = {
      setUsername: vi.fn().mockName("mockMatomo.setUsername"),
      startTracking: vi.fn().mockName("mockMatomo.startTracking"),
    };
    mockAngulartics = {
      setUserProperties: { next: vi.fn() },
    };

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
        {
          provide: LoginStateSubject,
          useValue: new BehaviorSubject(LoginState.LOGGED_IN),
        },
        { provide: SessionSubject, useValue: new BehaviorSubject(undefined) },
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
  it.skip("should not track if no url or site_id", () => {
    mockConfigService.getConfig.mockReturnValue({});
    service.init();
    expect(mockMatomo.startTracking).not.toHaveBeenCalled();
  });

  it.skip("should not track if no usage analytics config", () => {
    mockConfigService.getConfig.mockReturnValue(undefined);
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
    mockConfigService.getConfig.mockReturnValue(testAnalyticsConfig);
    service.init();

    configUpdates.next(new Config());

    expect(window["_paq"]).toContainEqual([
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
    mockConfigService.getConfig.mockReturnValue(testAnalyticsConfig);
    configUpdates.next(new Config());

    expect(window["_paq"]).toContainEqual([
      "setTrackerUrl",
      testAnalyticsConfig.url + "/matomo.php",
    ]);

    window["_paq"] = [];
    const testAnalyticsConfig2: UsageAnalyticsConfig = {
      site_id: "101",
      url: "test-endpoint/",
    };
    mockConfigService.getConfig.mockReturnValue(testAnalyticsConfig2);
    configUpdates.next(new Config());

    expect(window["_paq"]).toContainEqual([
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
