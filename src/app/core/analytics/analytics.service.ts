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
      AnalyticsService.getUserHash(username)
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
    return md5(username);
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
        if (newState === LoginState.LOGGED_IN) {
          AnalyticsService.setUser(this.sessionService.getCurrentUser().name);
        } else {
          AnalyticsService.setUser(undefined);
        }
      });
  }

  init(): void {
    AnalyticsService.angulartics2Piwik.startTracking();
    AnalyticsService.setVersion();
    AnalyticsService.setOrganization(AppConfig.settings.site_name);
  }
}
