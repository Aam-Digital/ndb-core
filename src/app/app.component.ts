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

import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { FirebaseNotificationService } from "../firebase-messaging-service.service";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  configFullscreen: boolean = false;
  message: any = null;

  constructor(
    private router: Router,
    private firebaseNotificationService: FirebaseNotificationService,
  ) {
    this.detectConfigMode();
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.detectConfigMode());
  }

  ngOnInit(): void {
    this.firebaseNotificationService.getFcmToken();
    this.firebaseNotificationService.listenForMessages();
  }

  /**
   * Switch the layout for certain admin routes to display those fullscreen without app menu and toolbar.
   * @private
   */
  private detectConfigMode() {
    const currentUrl = this.router.url;
    this.configFullscreen = currentUrl.startsWith("/admin/entity/");
  }
}
