import { Component, OnInit } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu } from "@angular/material/menu";
import { NgFor } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Logging } from "app/core/logging/logging.service";
import { NotificationEvent } from "./model/notifications-event";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationItemComponent } from "./notification-item/notification-item.component";
import { MockNotificationsService } from "./mock-notifications.service";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [
    MatBadgeModule,
    NgIf,
    FontAwesomeModule,
    MatMenu,
    NgFor,
    MatButtonModule,
    MatMenuTrigger,
    MatMenuModule,
    FormsModule,
    MatTooltipModule,
    MatTabsModule,
    NotificationItemComponent,
  ],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.scss",
})
export class NotificationsComponent implements OnInit {
  public allNotifications: NotificationEvent[] = [];
  public unreadNotifications: NotificationEvent[] = [];
  public hasUnreadNotificationCount = 0;
  public isEnableNotification = false;
  public selectedTab = 0;

  constructor(
    private entityMapper: EntityMapperService,
    private mockNotificationsService: MockNotificationsService,
  ) {}

  ngOnInit(): void {
    this.loadAndProcessNotifications();
  }

  onNotificationBellClick() {
    // this.firebaseNotificationService.sendNotification();
    Logging.log("notificationBellClicked");
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
    this.filterUserNotifications(notifications, "User:demo");
    this.hasUnreadNotificationCount = this.countUnreadNotifications(
      this.allNotifications,
    );
  }

  /**
   * Filters notifications based on the sender.
   * @param notifications - The list of notifications.
   * @param user - The user to filter notifications by.
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

  /**
   * Counts unread notifications from the list.
   * @param notifications - The list of notifications.
   */
  private countUnreadNotifications(notifications: NotificationEvent[]) {
    return notifications.filter((notification) => !notification.readStatus)
      .length;
  }

  markAllRead($event: Event) {
    $event.stopPropagation();
    Logging.log("All notifications marked as read");
  }

  async markAsRead(notification: NotificationEvent) {
    notification.readStatus = true;
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
    this.hasUnreadNotificationCount = this.countUnreadNotifications(
      this.allNotifications,
    );
    Logging.log("Notification deleted");
  }
}
