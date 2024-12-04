import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from "@angular/material/badge";
import { NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu } from '@angular/material/menu';
import { NgFor } from '@angular/common';
import { MatButtonModule } from "@angular/material/button";
import { MatMenuTrigger } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from "@angular/material/tooltip";
import { FirebaseNotificationService } from '../../../firebase-messaging-service.service';
import { Logging } from 'app/core/logging/logging.service';
import { NotificationActivity } from './model/notifications-activity';
import { EntityMapperService } from 'app/core/entity/entity-mapper/entity-mapper.service';

@Component({
  selector: 'app-notifications',
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
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  public notifications: NotificationActivity[] = [];
  public notificationCount = 0;
  public isEnableNotification = false;
  public showSettings = false;

  constructor(private firebaseNotificationService: FirebaseNotificationService, private entityMapper: EntityMapperService) {}

  ngOnInit(): void {
    this.loadAndProcessNotifications();
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.isEnableNotification = !this.isEnableNotification;
  }

  toggleSettings(event: Event) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  notificationClicked(notification) {
    notification.isUnread = false;
    console.log(notification.user + ' clicked');
  }

  onNotificationBellClick() {
    // this.firebaseNotificationService.sendNotification();
    Logging.log('notificationBellClicked');
    this.showSettings = false;
  }

  /**
   * Loads all notifications and processes them to update the list and unread count.
   */
  private async loadAndProcessNotifications(): Promise<void> {
    const allNotifications = await this.entityMapper.loadType<NotificationActivity>(NotificationActivity);
    // The user is hardcoded for testing purposes, need to remove this.
    this.notifications = this.filterUserNotifications(allNotifications, 'User:demo');
    this.notificationCount = this.countUnreadNotifications(this.notifications);
  }

  /**
   * Filters notifications based on the sender.
   * @param notifications - The list of notifications.
   * @param user - The user to filter notifications by.
   */
  private filterUserNotifications(notifications: NotificationActivity[], user: string): NotificationActivity[] {
    return notifications.filter(notification => notification.sentBy === user);
  }

  /**
   * Counts unread notifications from the list.
   * @param notifications - The list of notifications.
   */
  private countUnreadNotifications(notifications: NotificationActivity[]): number {
    return notifications.filter(notification => !notification.readStatus).length;
  }
}
