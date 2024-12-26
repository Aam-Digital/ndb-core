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
import { Router } from "@angular/router";

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
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.notificationsSubject.subscribe((notifications) => {
      this.filterUserNotifications(notifications);
    });

    this.loadAndProcessNotifications();
  }

  /**
   * Get the logged in user Id
   */
  private get userId(): string | undefined {
    return this.sessionInfo.value?.id;
  }

  /**
   * Loads all notifications and processes them to update the list and unread count.
   */
  private async loadAndProcessNotifications() {
    const notifications =
      await this.entityMapper.loadType<NotificationEvent>(NotificationEvent);

    const notificationConfig = await this.loadNotificationConfig(this.userId);
    this.hasNotificationEnabled = notificationConfig?.channels.push ?? false;

    this.notificationsSubject.next(notifications);
  }

  /**
   * Loads the user's notification configuration.
   */
  private async loadNotificationConfig(userId: string) {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        userId,
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Filters notifications based on the sender and read status.
   */
  private filterUserNotifications(notifications: NotificationEvent[]) {
    this.allNotifications = notifications.filter(
      (notification) => notification.notificationFor === this.userId,
    );
    this.unreadNotifications = notifications.filter(
      (notification) =>
        notification.notificationFor === this.userId &&
        !notification.readStatus,
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
    // TODO: Implement the logic to called the getToken function from the NotificationService file, Once the PR #2692 merged.
    this.hasNotificationEnabled = !this.hasNotificationEnabled;

    const notificationConfig = await this.loadNotificationConfig(this.userId);

    // TODO: Currently, email notification are disabled. Update this logic once the email notification feature is implemented.
    const notificationChannels = {
      push: this.hasNotificationEnabled,
      email: false,
    };

    if (notificationConfig) {
      notificationConfig.channels = notificationChannels;
      await this.entityMapper.save(notificationConfig);
    } else {
      const newNotificationConfig = new NotificationConfig(this.userId);
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
  ) {
    for (const notification of notifications) {
      notification.readStatus = newStatus;
      await this.entityMapper.save(notification);
    }
    this.filterUserNotifications(this.allNotifications);
  }

  /**
   * Updates the read status of a single notification.
   */
  async updateReadStatus(notification: NotificationEvent, newStatus: boolean) {
    notification.readStatus = newStatus;
    await this.entityMapper.save(notification);
    this.filterUserNotifications(this.allNotifications);
  }

  /**
   * Deletes a user notification.
   */
  async deleteNotification(notification: NotificationEvent) {
    await this.entityMapper.remove(notification);
    this.alertService.addInfo("Notification deleted successfully");
    this.loadAndProcessNotifications();
  }

  notificationListener(notification: NotificationEvent) {
    this.router.navigate([notification.actionURL]);
  }

  /**
   * Redirect the user to Notification setting page
   */
  onRedirectToNotificationsSetting() {
    this.router.navigate(["/user-account"], { queryParams: { tabIndex: 1 } });
  }
}
