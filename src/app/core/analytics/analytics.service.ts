import { Injectable } from "@angular/core";
import { Angulartics2Piwik } from "angulartics2/piwik";
import { environment } from "../../../environments/environment";
import { AppConfig } from "../app-config/app-config";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

const md5 = require("md5");

/**
 * Track usage analytics data and report it to a backend server like Matomo.
 *
 * This is automatically disabled if the config.json does not specify "usage_analytics" settings.
 */
@Injectable({
  providedIn: "root",
})
@UntilDestroy()
export class AnalyticsService {
  private static getUserHash(username: string) {
    return md5(AppConfig.settings?.site_name + username);
  }

  constructor(
    private angulartics2Piwik: Angulartics2Piwik,
    private sessionService: SessionService
  ) {
    this.subscribeToUserChanges();
  }

  private setUser(username: string): void {
    this.angulartics2Piwik.setUsername(
      AnalyticsService.getUserHash(username ?? "")
    );
  }

  private setVersion(): void {
    this.angulartics2Piwik.setUserProperties({
      dimension1: "ndb-core@" + environment.appVersion,
    });
  }

  private setOrganization(orgName: string): void {
    this.angulartics2Piwik.setUserProperties({
      dimension2: orgName,
    });
  }

  private subscribeToUserChanges() {
    this.sessionService.loginStateStream
      .pipe(untilDestroyed(this))
      .subscribe((newState) => {
        if (newState === LoginState.LOGGED_IN) {
          this.setUser(this.sessionService.getCurrentUser().name);
        } else {
          this.setUser(undefined);
        }
      });
  }

  /**
   * Set up usage analytics tracking - if the AppConfig specifies the required settings.
   */
  init(): void {
    if (!AppConfig.settings.usage_analytics) {
      // do not track
      return;
    }

    this.setUpMatomo(
      AppConfig.settings.usage_analytics.url,
      AppConfig.settings.usage_analytics.site_id
    );

    this.angulartics2Piwik.startTracking();
    this.setVersion();
    this.setOrganization(AppConfig.settings.site_name);
  }

  /**
   * dynamically sets up everything for Matomo.
   *
   * The code is inspired by:
   * https://github.com/Arnaud73/ngx-matomo/blob/master/projects/ngx-matomo/src/lib/matomo-injector.service.ts
   *
   * @param url The URL of the matomo backend
   * @param id The id of the Matomo site as which this app will be tracked
   * @private
   */
  private setUpMatomo(url: string, id: string) {
    window["_paq"] = window["_paq"] || [];
    window["_paq"].push([
      "setDocumentTitle",
      document.domain + "/" + document.title,
    ]);
    if (AppConfig.settings.usage_analytics.no_cookies) {
      window["_paq"].push(["disableCookies"]);
    }
    window["_paq"].push(["trackPageView"]);
    window["_paq"].push(["enableLinkTracking"]);
    (() => {
      const u = url;
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
    })();
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
      label: string;
      value?: number;
    } = {
      category: "no_category",
      label: "no_label",
    }
  ): void {
    this.angulartics2Piwik.eventTrack(action, properties);
  }
}
