import { Injectable, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ConfigService } from "../config/config.service";
import {
  USAGE_ANALYTICS_CONFIG_ID,
  UsageAnalyticsConfig,
} from "./usage-analytics-config";
import { Angulartics2, Angulartics2Matomo } from "angulartics2";
import md5 from "md5";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject } from "../session/session-type";
import { SessionSubject } from "../session/auth/session-info";

/**
 * Track usage analytics data and report it to a backend server like Matomo.
 *
 * This is automatically disabled if the config doc does not specify "usage_analytics" settings.
 */
@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private angulartics2 = inject(Angulartics2);
  private angulartics2Matomo = inject(Angulartics2Matomo);
  private configService = inject(ConfigService);
  private sessionInfo = inject(SessionSubject);

  private isInitialized = false;

  constructor() {
    const loginState = inject(LoginStateSubject);

    if (environment.production) {
      this.init();
    }

    // update the user context for remote error logging and tracking and load config initially
    loginState.subscribe((s: LoginState) => this.updateSessionInfo(s));
  }

  private updateSessionInfo(newState: LoginState): void {
    if (newState === LoginState.LOGGED_IN) {
      const username = this.sessionInfo.value?.name;
      this.setUser(username);
    } else {
      this.setUser(undefined);
    }
  }

  /**
   * Sets a unique user hash which is always for the same user but does not expose the username.
   * This improves the logging behavior.
   * @param username actual username
   */
  public setUser(username: string): void {
    const baseUrl = location.host;
    this.angulartics2Matomo.setUsername(md5(`${baseUrl}${username ?? ""}`));
  }

  /**
   * Set up usage analytics tracking.
   */
  init(): void {
    window["_paq"] = window["_paq"] || [];
    window["_paq"].push([
      "setDocumentTitle",
      document.domain + "/" + document.title,
    ]);
    window["_paq"].push(["trackPageView"]);
    window["_paq"].push(["enableLinkTracking"]);
    this.setVersion();
    this.setOrganization(location.hostname);
    this.setUser(undefined);
    this.configService.configUpdates.subscribe(() => this.setConfigValues());
  }

  private setVersion(): void {
    this.angulartics2.setUserProperties.next({
      dimension1: "ndb-core@" + environment.appVersion,
    });
  }

  private setOrganization(orgName: string): void {
    this.angulartics2.setUserProperties.next({
      dimension2: orgName,
    });
  }

  /**
   * dynamically sets up everything for Matomo.
   *
   * The code is inspired by:
   * https://github.com/Arnaud73/ngx-matomo/blob/master/projects/ngx-matomo/src/lib/matomo-injector.service.ts
   * @private
   */
  private setConfigValues() {
    const { url, site_id, no_cookies } =
      this.configService.getConfig<UsageAnalyticsConfig>(
        USAGE_ANALYTICS_CONFIG_ID,
      ) || { url: "https://matomo.aam-digital.org" };
    const u = url.endsWith("/") ? url : url + "/";

    if (!this.isInitialized) {
      const g = document.createElement("script");
      const s = document.getElementsByTagName("script")[0];
      g.type = "text/javascript";
      g.async = true;
      g.defer = true;
      g.src = u + "matomo.js";
      s.parentNode.insertBefore(g, s);
      this.angulartics2Matomo.startTracking();
      this.isInitialized = true;
    }

    window["_paq"].push(["setTrackerUrl", u + "matomo.php"]);
    if (no_cookies) {
      window["_paq"].push(["disableCookies"]);
    }
    if (site_id) {
      window["_paq"].push(["setSiteId", site_id]);
    }
  }

  /**
   * Explicitly record a user action
   * @param action String identifying the action
   * @param properties Additional properties for categorization
   */
  eventTrack(
    action: string,
    properties: {
      category: string;
      label?: string;
      value?: number;
    } = {
      category: "no_category",
      label: "no_label",
    },
  ): void {
    this.angulartics2.eventTrack.next({
      action: action,
      properties: properties,
    });
  }
}
