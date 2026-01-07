import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { Subject, Subscription } from "rxjs";
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
import { Router, RouterLink } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { applyUpdate } from "../../core/entity/model/entity-update";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { NotificationConfig } from "./model/notification-config";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";

/**
 * Display Notification indicator for toolbar
 * that opens into a list of notification events.
 */
@UntilDestroy()
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
    RouterLink,
  ],
  templateUrl: "./notification.component.html",
  styleUrl: "./notification.component.scss",
})
export class NotificationComponent implements OnInit {
  private readonly notificationsSubject = new Subject<NotificationEvent[]>();
  public selectedTab = 0;
  protected readonly closeOnlySubmenu = closeOnlySubmenu;

  /** whether an initial notification config exists for the user */
  hasNotificationConfig = false;

  /** Number of notifications to show initially and per "Load more" click */
  private readonly PAGE_SIZE = 10;

  /** All notifications for the user */
  readonly allNotifications = signal<NotificationEvent[]>([]);

  /** Unread notifications for the user */
  readonly unreadNotifications = signal<NotificationEvent[]>([]);

  /** Current display limit for "All" tab */
  readonly displayLimitAll = signal(this.PAGE_SIZE);

  /** Current display limit for "Unread" tab */
  readonly displayLimitUnread = signal(this.PAGE_SIZE);

  /** Get notifications to display in "All" tab (limited) */
  readonly visibleAllNotifications = computed(() =>
    this.allNotifications().slice(0, this.displayLimitAll()),
  );

  /** Get notifications to display in "Unread" tab (limited) */
  readonly visibleUnreadNotifications = computed(() =>
    this.unreadNotifications().slice(0, this.displayLimitUnread()),
  );

  /** Check if there are more notifications to load in "All" tab */
  readonly hasMoreAllNotifications = computed(
    () => this.allNotifications().length > this.displayLimitAll(),
  );

  /** Check if there are more notifications to load in "Unread" tab */
  readonly hasMoreUnreadNotifications = computed(
    () => this.unreadNotifications().length > this.displayLimitUnread(),
  );

  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly router = inject(Router);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly dbResolver = inject(DatabaseResolverService);

  ngOnInit() {
    this.notificationsSubject.subscribe((notifications) => {
      this.filterUserNotifications(notifications);
    });

    this.loadAndProcessNotifications();
    this.listenToEntityUpdates();

    this.checkNotificationConfigStatus();
  }

  private async checkNotificationConfigStatus() {
    const initial = await this.entityMapper
      .load<NotificationConfig>(NotificationConfig, this.userId)
      .then((doc) => !!doc)
      .catch(() => false);
    this.setNotificationConfigStatus(initial);

    this.entityMapper
      .receiveUpdates(NotificationConfig)
      .pipe(untilDestroyed(this))
      .subscribe((next) => this.setNotificationConfigStatus(!!next.entity));
  }

  private setNotificationConfigStatus(hasNotificationConfig: boolean) {
    this.hasNotificationConfig = hasNotificationConfig;
    if (hasNotificationConfig) {
      // initialize DB (only now, as we know the user has notifications configured)
      this.dbResolver.initializeNotificationsDatabaseForCurrentUser(
        this.userId,
      );
    }
  }

  /**
   * Get the logged-in user id
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

    this.notificationsSubject.next(notifications);
  }

  private updateSubscription: Subscription;

  private listenToEntityUpdates() {
    if (!this.updateSubscription) {
      this.updateSubscription = this.entityMapper
        .receiveUpdates(NotificationEvent)
        .pipe(untilDestroyed(this))
        .subscribe((next) => {
          this.notificationsSubject.next(
            applyUpdate(this.allNotifications(), next),
          );
        });
    }
  }

  /**
   * Filters notifications based on the sender and read status.
   */
  private filterUserNotifications(notifications: NotificationEvent[]) {
    this.allNotifications.set(
      notifications.sort(
        (notificationA, notificationB) =>
          notificationB.created.at.getTime() -
          notificationA.created.at.getTime(),
      ),
    );
    this.unreadNotifications.set(
      notifications.filter((notification) => !notification.readStatus),
    );
  }

  /**
   * Load more notifications for the current tab.
   */
  loadMore(): void {
    if (this.selectedTab === 0) {
      this.displayLimitAll.update((limit) => limit + this.PAGE_SIZE);
    } else {
      this.displayLimitUnread.update((limit) => limit + this.PAGE_SIZE);
    }
  }

  /**
   * Marks all notifications as read.
   */
  async markAllRead(): Promise<void> {
    const unreadNotifications = this.allNotifications().filter(
      (notification) => !notification.readStatus,
    );
    await this.updateReadStatus(unreadNotifications, true);
  }

  /**
   * Updates the read status for multiple notifications.
   */
  async updateReadStatus(
    notifications: NotificationEvent[],
    newStatus: boolean,
  ) {
    for (const notification of notifications) {
      notification.readStatus = newStatus;
      await this.entityMapper.save(notification);
    }
    this.filterUserNotifications(this.allNotifications());
  }

  /**
   * Deletes a user notification.
   */
  async deleteNotification(notification: NotificationEvent) {
    await this.entityMapper.remove(notification);
  }

  private generateNotificationActionURL(
    notification: NotificationEvent,
  ): string {
    if (!notification.context) return notification.actionURL;

    let actionURL = "";

    switch (notification.notificationType) {
      case "entity_change":
        actionURL = this.generateEntityUrl(notification);
        break;
      default:
        actionURL = notification.actionURL;
    }

    return actionURL;
  }

  private generateEntityUrl(notification: NotificationEvent): string {
    let url = "";

    const entityCtr = this.entityRegistry.get(notification.context.entityType);
    if (entityCtr) {
      url = `/${entityCtr?.route}`;
      if (notification.context.entityId) {
        url += `/${notification.context.entityId}`;
      }
    }

    return url;
  }

  /**
   * Updates the read status of a selected notification.
   * Handles notification events by redirecting the user to the corresponding action URL.
   * @param {NotificationEvent} notification - The notification event containing the action URL.
   */
  async notificationClicked(
    notification: NotificationEvent,
    notificationListTrigger: MatMenuTrigger,
    event: NotificationEvent,
  ) {
    await this.updateReadStatus([notification], true);
    const actionURL = this.generateNotificationActionURL(notification);
    if (!actionURL) return;
    await this.router.navigate([actionURL]);

    // Close the notification menu after clicking a notification
    this.closeOnlySubmenu(
      notificationListTrigger,
      event as unknown as MouseEvent,
    );
  }
}
