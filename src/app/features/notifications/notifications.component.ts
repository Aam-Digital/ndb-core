import { Component, OnInit } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu } from "@angular/material/menu";
import { NgFor } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatMenuModule } from "@angular/material/menu";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FirebaseNotificationService } from "../../../firebase-messaging-service.service";
import { Logging } from "app/core/logging/logging.service";
import { NotificationActivity } from "./model/notifications-activity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationItemComponent } from "./notification-item/notification-item.component";
import { Router } from "@angular/router";

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
    MatSlideToggle,
    FormsModule,
    MatTooltipModule,
    MatTabsModule,
    NotificationItemComponent,
  ],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.scss",
})
export class NotificationsComponent implements OnInit {
  public allNotifications: NotificationActivity[] = [];
  public unreadNotifications: NotificationActivity[] = [];
  public hasUnreadNotificationCount = 0;
  public isEnableNotification = false;
  public selectedTab = 0;

  constructor(
    private firebaseNotificationService: FirebaseNotificationService,
    private entityMapper: EntityMapperService,
    private router: Router,
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
    const notifications =
      await this.entityMapper.loadType<NotificationActivity>(
        NotificationActivity,
      );
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
    notifications: NotificationActivity[],
    user: string,
  ) {
    this.allNotifications = notifications.filter(
      (notification) => notification.sentBy === user,
    );
    this.unreadNotifications = notifications.filter(
      (notification) =>
        notification.sentBy === user && notification.readStatus === false,
    );
  }

  /**
   * Counts unread notifications from the list.
   * @param notifications - The list of notifications.
   */
  private countUnreadNotifications(notifications: NotificationActivity[]) {
    return notifications.filter(
      (notification) => notification.readStatus === false,
    ).length;
  }

  markAllRead($event: Event) {
    $event.stopPropagation();
    Logging.log("All notifications marked as read");
  }

  markAsRead(notification: NotificationActivity): void {
    // Need to add/update this logic to mark as read the notification from the CouchDB
    notification.readStatus = true;
    this.hasUnreadNotificationCount = this.countUnreadNotifications(
      this.allNotifications,
    );
    Logging.log("Notification marked as read");
  }

  deleteNotification(notification: NotificationActivity) {
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

  onRedirectToNotificationsSetting(event: Event) {
    event.stopPropagation();
    this.router.navigate(["/user-account"], { queryParams: { tabIndex: 1 } });
  }
}
