import { Injectable } from "@angular/core";
import { Angulartics2Piwik } from "angulartics2/piwik";
import { MD5 } from "./md5-hash";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  static angulartics2Piwik: Angulartics2Piwik;

  constructor(private angulartics2Piwik: Angulartics2Piwik) {
    AnalyticsService.angulartics2Piwik = angulartics2Piwik;
  }

  init(): void {
    AnalyticsService.angulartics2Piwik.startTracking();
    AnalyticsService.setVersion();
  }

  static eventTrack(
    action: string,
    properties: {
      category: string;
      label: string;
      value: number;
    } = {
      category: "no_category",
      label: "no_label",
      value: -1
    }
  ): void {
    AnalyticsService.angulartics2Piwik.eventTrack(action, properties);
  }

  static setUser(username: string): void {
    AnalyticsService.angulartics2Piwik.setUsername(this.getUserHash(username));
  }

  static setVersion(): void {
    AnalyticsService.angulartics2Piwik.setUserProperties({
      dimension1: "ndb-core@" + environment.appVersion,
    });
  }

  private static getUserHash(username: string) {
    return MD5(username);
  }
}
