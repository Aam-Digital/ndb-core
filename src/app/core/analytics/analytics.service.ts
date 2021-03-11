import { Injectable } from "@angular/core";
import { Angulartics2Piwik } from "angulartics2/piwik";
import { environment } from "../../../environments/environment";
import { AppConfig } from "../app-config/app-config";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";

const md5 = require("md5");

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  static angulartics2Piwik: Angulartics2Piwik;

  static eventTrack(
    action: string,
    properties: {
      category: string;
      label: string;
      value: number;
    } = {
      category: "no_category",
      label: "no_label",
      value: -1,
    }
  ): void {
    AnalyticsService.angulartics2Piwik.eventTrack(action, properties);
  }

  static setUser(username: string): void {
    AnalyticsService.angulartics2Piwik.setUsername(
      AnalyticsService.getUserHash(username ?? "")
    );
  }

  static setVersion(): void {
    AnalyticsService.angulartics2Piwik.setUserProperties({
      dimension1: "ndb-core@" + environment.appVersion,
    });
  }

  static setOrganization(orgName: string): void {
    AnalyticsService.angulartics2Piwik.setUserProperties({
      dimension2: orgName,
    });
  }

  private static getUserHash(username: string) {
    return md5(AppConfig.settings.site_name + username);
  }

  constructor(
    private angulartics2Piwik: Angulartics2Piwik,
    private sessionService: SessionService
  ) {
    AnalyticsService.angulartics2Piwik = angulartics2Piwik;

    this.subscribeToUserChanges();
  }

  private subscribeToUserChanges() {
    this.sessionService
      .getLoginState()
      .getStateChangedStream()
      .subscribe((newState) => {
        if (newState.toState === LoginState.LOGGED_IN) {
          AnalyticsService.setUser(this.sessionService.getCurrentUser().name);
        } else {
          AnalyticsService.setUser(undefined);
        }
      });
  }

  init(): void {
    if (!AppConfig.settings.usage_analytics) {
      // do not track
      return;
    }

    this.setUpMatomo(
      AppConfig.settings.usage_analytics.url,
      AppConfig.settings.usage_analytics.site_id
    );

    AnalyticsService.angulartics2Piwik.startTracking();
    AnalyticsService.setVersion();
    AnalyticsService.setOrganization(AppConfig.settings.site_name);
  }

  /**
   * dynamically adds sets up everything for Matomo.
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
}
