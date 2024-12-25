import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { MatBadgeModule } from "@angular/material/badge";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotificationEvent } from "./model/notification-event";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationItemComponent } from "./notification-item/notification-item.component";
import { SessionSubject } from "app/core/session/auth/session-info";
import { closeOnlySubmenu } from "./close-only-submenu";
import { NotificationConfig } from "./model/notification-config";
import { AlertService } from "app/core/alerts/alert.service";

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
  private notificationsSubject = new Subject<NotificationEvent[]>();
  public selectedTab = 0;
  public hasNotificationEnabled = false;
  protected readonly closeOnlySubmenu = closeOnlySubmenu;

  constructor(
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.notificationsSubject.subscribe((notifications) => {
      this.filterUserNotifications(notifications);
    });

    this.loadAndProcessNotifications();
  }

  /**
   * Loads all notifications and processes them to update the list and unread count.
   */
  private async loadAndProcessNotifications(): Promise<void> {
    const notifications =
      await this.entityMapper.loadType<NotificationEvent>(NotificationEvent);
    const user = this.sessionInfo.value?.id;

    const notificationConfig = await this.loadNotificationConfig(user);
    this.hasNotificationEnabled = notificationConfig?.channels.push ?? false;

    this.notificationsSubject.next(notifications);
  }

  /**
   * Loads the user's notification configuration.
   */
  private async loadNotificationConfig(
    user: string,
  ): Promise<NotificationConfig | null> {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        user,
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Filters notifications based on the sender and read status.
   */
  private filterUserNotifications(notifications: NotificationEvent[]) {
    const user = this.sessionInfo.value?.id;
    this.allNotifications = notifications.filter(
      (notification) => notification.sentBy === user,
    );
    this.unreadNotifications = notifications.filter(
      (notification) =>
        notification.sentBy === user && !notification.readStatus,
    );
  }

  /**
   * Marks all notifications as read.
   */
  async markAllRead(): Promise<void> {
    const unreadNotifications = this.allNotifications.filter(
      (notification) => !notification.readStatus,
    );
    await this.updateReadStatusForNotifications(unreadNotifications, true);
  }

  /**
   * Toggles the notification setting for the user.
   */
  async enableNotificationForUser(): Promise<void> {
    this.hasNotificationEnabled = !this.hasNotificationEnabled;
    const user = this.sessionInfo.value?.id;

    const notificationConfig = await this.loadNotificationConfig(user);
    const notificationChannels = {
      push: this.hasNotificationEnabled,
      email: false,
    };

    if (notificationConfig) {
      notificationConfig.channels = notificationChannels;
      await this.entityMapper.save(notificationConfig);
    } else {
      const newNotificationConfig = new NotificationConfig(user);
      newNotificationConfig.channels = notificationChannels;
      await this.entityMapper.save(newNotificationConfig);
    }

    this.alertService.addInfo(
      `Notification ${this.hasNotificationEnabled ? "enabled" : "disabled"}.`,
    );
  }

  /**
   * Updates the read status for multiple notifications.
   */
  private async updateReadStatusForNotifications(
    notifications: NotificationEvent[],
    newStatus: boolean,
  ): Promise<void> {
    for (const notification of notifications) {
      notification.readStatus = newStatus;
      await this.entityMapper.save(notification);
    }
    this.filterUserNotifications(this.allNotifications);
  }

  /**
   * Updates the read status of a single notification.
   */
  async updateReadStatus(
    notification: NotificationEvent,
    newStatus: boolean,
  ): Promise<void> {
    notification.readStatus = newStatus;
    await this.entityMapper.save(notification);
    this.filterUserNotifications(this.allNotifications);
  }

  /**
   * Deletes a user notification.
   */
  async deleteNotification(notification: NotificationEvent): Promise<void> {
    await this.entityMapper.remove(notification);
    this.alertService.addInfo("Notification deleted successfully");
    this.loadAndProcessNotifications();
  }
}
