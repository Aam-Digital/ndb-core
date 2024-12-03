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
import { Logging } from "./core/logging/logging.service";
import { EntityMapperService } from "./core/entity/entity-mapper/entity-mapper.service";
import { NotificationActivity } from "./features/notifications/model/notifications-activity";
import { FirebaseNotificationService } from '../firebase-messaging-service.service';
import { CurrentUserSubject } from "./core/session/current-user-subject";

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

  constructor(private router: Router, private entityMapper: EntityMapperService, private firebaseNotificationService: FirebaseNotificationService, private currentUser: CurrentUserSubject,) {
    this.detectConfigMode();
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.detectConfigMode());
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

  private async createAndSaveNotification(token: string) {
    const notification = new NotificationActivity();
    notification.title = "Dummy Notification Title";
    notification.body = "This is a dummy notification body.";
    notification.actionURL = "http://localhost:4200";
    notification.sentBy = this.currentUser.value?.getId();
    notification.fcmToken = token;
    notification.readStatus = false;

    try {
      await this.entityMapper.save<NotificationActivity>(notification);
      Logging.log("Notification saved successfully.");
    } catch (error) {
      Logging.error("Error saving notification: ", error);
    }
  }
}
