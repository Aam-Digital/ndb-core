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

const md5 = require("md5");

/**
 * Track usage analytics data and report it to a backend server like Matomo.
 *
 * This is automatically disabled if the config.json does not specify "usage_analytics" settings.
 */
@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private static getUserHash(username: string) {
    return md5(AppConfig.settings?.site_name + username);
  }

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
   * Set up usage analytics tracking - if the AppConfig specifies the required settings.
   */
  init(): void {
    const config = this.configService.getConfig<UsageAnalyticsConfig>(
      USAGE_ANALYTICS_CONFIG_ID
    );

    if (!config || !config.url || !config.site_id) {
      // do not track
      return;
    }

    this.setUpMatomo(config.url, config.site_id, config.no_cookies);

    this.setVersion();
    this.setOrganization(AppConfig.settings.site_name);
    this.setUser(undefined);

    this.angulartics2Matomo.startTracking();
  }

  /**
   * dynamically sets up everything for Matomo.
   *
   * The code is inspired by:
   * https://github.com/Arnaud73/ngx-matomo/blob/master/projects/ngx-matomo/src/lib/matomo-injector.service.ts
   *
   * @param url The URL of the matomo backend
   * @param id The id of the Matomo site as which this app will be tracked
   * @param disableCookies (Optional) flag whether to disable use of cookies to track sessions
   * @private
   */
  private setUpMatomo(
    url: string,
    id: string,
    disableCookies: boolean = false
  ) {
    window["_paq"] = window["_paq"] || [];
    window["_paq"].push([
      "setDocumentTitle",
      document.domain + "/" + document.title,
    ]);
    if (disableCookies) {
      window["_paq"].push(["disableCookies"]);
    }
    window["_paq"].push(["trackPageView"]);
    window["_paq"].push(["enableLinkTracking"]);
    const u = url.endsWith("/") ? url : url + "/";
    window["_paq"].push(["setTrackerUrl", u + "matomo.php"]);
    window["_paq"].push(["setSiteId", id]);
    const d = document;
    const g = d.createElement("script");
    const s = d.getElementsByTagName("script")[0];
    g.type = "text/javascript";
    g.async = true;
    g.defer = true;
    g.src = u + "matomo.js";
    s.parentNode.insertBefore(g, s);
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
