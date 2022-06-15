import { Injectable } from "@angular/core";
import { Angulartics2Matomo } from "angulartics2/matomo";
import { environment } from "../../../environments/environment";
import { AppConfig } from "../app-config/app-config";
import { ConfigService } from "../config/config.service";
import {
  USAGE_ANALYTICS_CONFIG_ID,
  UsageAnalyticsConfig,
} from "./usage-analytics-config";
import { Angulartics2 } from "angulartics2";
import md5 from "md5";

/**
 * Track usage analytics data and report it to a backend server like Matomo.
 *
 * This is automatically disabled if the config.json does not specify "usage_analytics" settings.
 */
@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private static getUserHash(username: string): string {
    return md5(AppConfig.settings?.site_name + username);
  }

  private isInitialized = false;

  constructor(
    private angulartics2: Angulartics2,
    private angulartics2Matomo: Angulartics2Matomo,
    private configService: ConfigService
  ) {}

  public setUser(username: string): void {
    this.angulartics2Matomo.setUsername(
      AnalyticsService.getUserHash(username ?? "")
    );
  }

  /**
   * Set up usage analytics tracking - if the AppConfig specifies the required settings.
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
    this.setOrganization(AppConfig.settings.site_name);
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
        USAGE_ANALYTICS_CONFIG_ID
      ) || {};
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

    if (no_cookies) {
      window["_paq"].push(["disableCookies"]);
    }
    if (url) {
      window["_paq"].push(["setTrackerUrl", u + "matomo.php"]);
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
    }
  ): void {
    this.angulartics2.eventTrack.next({
      action: action,
      properties: properties,
    });
  }
}
