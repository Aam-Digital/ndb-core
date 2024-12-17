import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationEvent } from "../model/notification-event";
import { NotificationTimePipe } from "../NotificationTimePipe";

@Component({
  selector: "app-notification-item",
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
    CommonModule,
    NotificationTimePipe,
  ],
  templateUrl: "./notification-item.component.html",
  styleUrl: "./notification-item.component.scss",
})
export class NotificationItemComponent {
  @Input() notification: NotificationEvent;

  @Output() markAsRead = new EventEmitter<NotificationEvent>();
  @Output() deleteNotification = new EventEmitter<NotificationEvent>();

  handleMarkAsRead() {
    this.notification.readStatus = !this.notification.readStatus;
    this.markAsRead.emit(this.notification);
  }

  handleDeleteNotification() {
    this.deleteNotification.emit(this.notification);
  }
}
