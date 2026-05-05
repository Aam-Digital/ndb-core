/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginState } from "../session-states/login-state.enum";
import { LoginStateSubject, SessionType } from "../session-type";
import { AsyncPipe } from "@angular/common";
import { SessionManagerService } from "../session-service/session-manager.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { SessionInfo } from "../auth/session-info";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { waitForChangeTo } from "../session-states/session-utils";
import { race, timer } from "rxjs";
import { environment } from "../../../../environments/environment";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";
import { Logging } from "../../logging/logging.service";

/**
 * Allows the user to login online or offline depending on the connection status
 */
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    AsyncPipe,
    MatTooltipModule,
    MatListModule,
    FontAwesomeModule,
    MatCheckboxModule,
    FormsModule,
  ],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  sessionManager = inject(SessionManagerService);
  loginState = inject(LoginStateSubject);
  siteSettingsService = inject(SiteSettingsService);

  offlineUsers: SessionInfo[] = [];
  /**
   * Whether offline-login buttons are clickable.
   * Becomes true once the remote login has failed or after a hard timeout,
   * so the user always has a fallback path to enter the app.
   */
  enableOfflineLogin = signal(false);
  loginInProgress = signal(false);

  /** Whether the offline login section should be shown at all. */
  showOfflineSection = signal(false);

  /** Whether the initial silent SSO check has completed (showing the login form). */
  ssoCheckDone = signal(false);

  /**
   * localStorage key under which the online-only preference is persisted.
   * Read by bootstrap-environment.ts on every page load (before Angular DI starts)
   * to set environment.session_type before any database instances are created.
   */
  private static readonly ONLINE_ONLY_KEY = "session_online_only";

  /**
   * Whether the deployment is configured as "synced" (local + remote).
   * Only in that case is the online-only opt-out meaningful to show.
   * Also true when bootstrap already switched to "online" based on a previous preference.
   * Hidden when session_type_choice is false (operator enforces a fixed session type).
   */
  showOnlineOnlyOption =
    environment.session_type_choice !== false &&
    (environment.session_type === SessionType.synced ||
      environment.session_type === SessionType.online);

  /** User preference: use online-only mode instead of synced. */
  onlineOnly = signal(false);

  constructor() {
    const sessionManager = this.sessionManager;

    // restore previous online-only preference from localStorage
    const initialOnlineOnly =
      localStorage.getItem(LoginComponent.ONLINE_ONLY_KEY) === "true" ||
      environment.session_type === SessionType.online;
    this.onlineOnly.set(initialOnlineOnly);
    this.applyOnlineOnlyMode(initialOnlineOnly);

    this.enableOfflineLogin.set(!this.sessionManager.remoteLoginAvailable());
    this.showOfflineSection.set(!navigator.onLine);

    // Only do a silent SSO check — don't redirect to Keycloak yet.
    // This allows the user to see and interact with the login page settings first.
    sessionManager.checkRemoteSession().finally(() => {
      this.ssoCheckDone.set(true);
      sessionManager.clearRemoteSessionIfNecessary();
    });
  }

  ngOnInit() {
    this.loginState.pipe(untilDestroyed(this)).subscribe((state) => {
      this.loginInProgress.set(state === LoginState.IN_PROGRESS);
      if (state === LoginState.LOGGED_IN) {
        this.routeAfterLogin();
      }
    });

    this.offlineUsers = this.sessionManager.getOfflineUsers();
    race(
      this.loginState.pipe(waitForChangeTo(LoginState.LOGIN_FAILED)),
      timer(10000),
    ).subscribe(() => {
      // Always reveal the fallback after a hard timeout or on login failure,
      // so a stuck remote login can never trap the user without an escape.
      this.enableOfflineLogin.set(true);
      this.showOfflineSection.set(true);
    });
  }

  onOnlineOnlyChanged(checked: boolean) {
    this.onlineOnly.set(checked);
    if (checked) {
      localStorage.setItem(LoginComponent.ONLINE_ONLY_KEY, "true");
    } else {
      localStorage.removeItem(LoginComponent.ONLINE_ONLY_KEY);
    }
    this.applyOnlineOnlyMode(checked);
  }

  /**
   * Mutate environment.session_type so that the correct database class is used
   * when initDatabasesForSession() is called after login.
   *
   * NOTE: The actual database instances are created lazily on first access during
   * Angular DI startup — long before LoginComponent exists. For that reason,
   * bootstrap-environment.ts also reads the localStorage preference early and
   * applies it before Angular starts. This in-component mutation covers the case
   * where the user toggles the checkbox in the *same page load* (i.e. before
   * the Keycloak redirect has happened), so the preference is applied consistently
   * regardless of whether the DB was already created or not yet.
   *
   * The authoritative path is: user changes checkbox → localStorage updated here →
   * Keycloak login triggers full page reload → bootstrap-environment.ts applies
   * the preference → Angular DI creates the correct DB type from the start.
   */
  private applyOnlineOnlyMode(onlineOnly: boolean) {
    if (onlineOnly) {
      environment.session_type = SessionType.online;
    } else if (environment.session_type === SessionType.online) {
      environment.session_type = SessionType.synced;
    }
  }

  private routeAfterLogin() {
    const redirectUri = this.route.snapshot.queryParams["redirect_uri"] || "";
    const safeRedirectUri = this.safeRedirectUrl(redirectUri);
    this.router.navigateByUrl(safeRedirectUri);
  }

  private safeRedirectUrl(redirectUri: string): string {
    if (!redirectUri) return "/";

    try {
      const decodedUri = decodeURIComponent(redirectUri);
      const base = window.location.origin;
      const fullUrl = new URL(decodedUri, base);

      // validate same origin and path
      if (fullUrl.origin !== base || !fullUrl.pathname.startsWith("/")) {
        Logging.debug(
          `Login: rejected redirect_uri (cross-origin or invalid path): ${redirectUri}`,
        );
        return "/";
      }

      return fullUrl.pathname + fullUrl.search + fullUrl.hash;
    } catch (e) {
      Logging.debug(
        `Login: rejected redirect_uri (parse error): ${redirectUri}`,
        e,
      );
      return "/"; // fallback for invalid urls
    }
  }

  tryLogin() {
    this.showOfflineSection.set(true);
    return this.sessionManager.remoteLogin();
  }
}
