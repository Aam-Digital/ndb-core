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
  public selectedTab = 0;
  public hasNotificationEnabled = false;
  protected readonly closeOnlySubmenu = closeOnlySubmenu;

  constructor(
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadAndProcessNotifications();
  }

  /**
   * Loads all notifications and processes them to update the list and unread count.
   */
  private async loadAndProcessNotifications(): Promise<void> {
    const notifications =
      await this.entityMapper.loadType<NotificationEvent>(NotificationEvent);
    this.filterUserNotifications(notifications);
  }

  /**
   * Filters notifications based on the sender.
   * @param notifications - The list of notifications.
   * @param user - The user to filter notifications.
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

  async markAllRead() {
    this.allNotifications.forEach((notification) => {
      if (!notification.readStatus) {
        notification.readStatus = true;
        this.entityMapper.save(notification);
      }
    });
    this.loadAndProcessNotifications();
  }

  async enableNotificationForUser() {
    // TODO: Implement the logic to called the getToken function from the NotificationService file, Once the PR #2692 merged.
    this.hasNotificationEnabled = !this.hasNotificationEnabled;
    const notificationConfig = new NotificationConfig();

    // TODO: Currently, email notification are disabled. Update this logic once the email notification feature is implemented.
    notificationConfig.channels = {
      push: this.hasNotificationEnabled,
      email: false,
    };
    notificationConfig.notificationTypes = [];

    try {
      await this.entityMapper.save<NotificationConfig>(notificationConfig);
      Logging.log("Notification saved successfully.");
    } catch (error) {
      throw error("Error saving notification: ", error);
    }
  }

  async updateReadStatus(notification: NotificationEvent, newStatus: boolean) {
    notification.readStatus = newStatus;
    await this.entityMapper.save(notification);
    this.filterUserNotifications(this.allNotifications);
  }

  async deleteNotification(notification: NotificationEvent) {
    await this.entityMapper.remove(notification);
    this.alertService.addInfo(`Notification deleted successfully`);
    this.loadAndProcessNotifications();
  }
}
