import { Component } from '@angular/core';
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
export class NotificationsComponent {
  isEnableNotification = false;
  showSettings = false;

  notifications = [
    { user: 'Brigid Dawson', message: 'update child entity.', time: '4 hours ago', avatar: 'avatar1.jpg', isUnread: true },
    { user: 'John Dwyer', message: 'create new student.', time: 'Yesterday', avatar: 'avatar2.jpg', isUnread: true },
    { user: 'Tim Hellman', message: 'update the config.', time: 'Tuesday', avatar: 'avatar3.jpg', isUnread: false },
  ];

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
    this.showSettings = false;
  }
}
