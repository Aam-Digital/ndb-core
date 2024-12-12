import { Component, Input } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { NgIf, CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationActivity } from "../model/notifications-activity";

@Component({
  selector: "app-notification-item",
  standalone: true,
  imports: [
    MatBadgeModule,
    NgIf,
    FontAwesomeModule,
    MatMenu,
    MatButtonModule,
    MatMenuTrigger,
    MatMenuModule,
    FormsModule,
    MatTooltipModule,
    MatTabsModule,
    CommonModule,
  ],
  templateUrl: "./notification-item.component.html",
  styleUrl: "./notification-item.component.scss",
})
export class NotificationItemComponent {
  @Input() notification: NotificationActivity;
  @Input() onMarkAsRead: Function;
  @Input() onDeleteNotification: Function;

  markAsRead() {
    this.onMarkAsRead(this.notification);
  }

  deleteNotification() {
    this.onDeleteNotification(this.notification);
  }
}
