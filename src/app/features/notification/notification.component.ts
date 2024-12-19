import { Component, OnInit } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Logging } from "app/core/logging/logging.service";
import { NotificationEvent } from "./model/notification-event";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationItemComponent } from "./notification-item/notification-item.component";
import { MockNotificationsService } from "./mock-notification.service";
import { SessionSubject } from "app/core/session/auth/session-info";
import { closeOnlySubmenu } from "./close-only-submenu";

@Component({
  selector: "app-notification",
  standalone: true,
  imports: [
    MatBadgeModule,
    FontAwesomeModule,
    MatMenu,
    MatButtonModule,
    MatMenuTrigger,
    MatMenuModule,
    FormsModule,
    MatTooltipModule,
    MatTabsModule,
    NotificationItemComponent,
  ],
  templateUrl: "./notification.component.html",
  styleUrl: "./notification.component.scss",
})
export class NotificationComponent implements OnInit {
  public allNotifications: NotificationEvent[] = [];
  public unreadNotifications: NotificationEvent[] = [];
  public selectedTab = 0;
  public hasNotificationEnabled = false;

  constructor(
    private entityMapper: EntityMapperService,
    private mockNotificationsService: MockNotificationsService,
    private sessionInfo: SessionSubject,
  ) {}

  ngOnInit(): void {
    this.loadAndProcessNotifications();
  }

  /**
   * Loads all notifications and processes them to update the list and unread count.
   */
  private async loadAndProcessNotifications(): Promise<void> {
    // TODO: Need to uncomment this after the notification list UI testing is completed.
    // const notifications =
    // await this.entityMapper.loadType<NotificationEvent>(NotificationEvent);

    // TODO: Need to remove this line once the notification list UI tests are completed.
    const notifications =
      this.mockNotificationsService.getNotifications() as unknown as NotificationEvent[];

    // The user is hardcoded for testing purposes, need to remove this.
    this.filterUserNotifications(notifications, this.sessionInfo.value?.id);
  }

  /**
   * Filters notifications based on the sender.
   * @param notifications - The list of notifications.
   * @param user - The user to filter notifications.
   */
  private filterUserNotifications(
    notifications: NotificationEvent[],
    user: string,
  ) {
    this.allNotifications = notifications.filter(
      (notification) => notification.sentBy === user,
    );
    this.unreadNotifications = notifications.filter(
      (notification) =>
        notification.sentBy === user && !notification.readStatus,
    );
  }

  markAllRead() {
    // TODO: Implement the logic to mark all notifications as read.
    Logging.log("All notifications marked as read");
  }

  enableNotificationForUser() {
    // TODO: Need to implement the logic so that the notification is enabled corresponding to the user.
    Logging.log("Notification enabled");
  }

  async updateReadStatus(notification: NotificationEvent) {
    notification.readStatus = notification.readStatus;
    await this.entityMapper.save(notification);
  }

  deleteNotification(notification: NotificationEvent) {
    // Need to add/update this logic to delete the notification from the CouchDB
    this.allNotifications = this.allNotifications.filter(
      (n) => n !== notification,
    );
    this.unreadNotifications = this.unreadNotifications.filter(
      (n) => n !== notification,
    );
    Logging.log("Notification deleted");
  }

  protected readonly closeOnlySubmenu = closeOnlySubmenu;
}
