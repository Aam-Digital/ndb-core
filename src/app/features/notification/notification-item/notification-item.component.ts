import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTabsModule } from "@angular/material/tabs";
import { NotificationEvent } from "../model/notification-event";
import { NotificationTimePipe } from "../notification-time.pipe";
import { closeOnlySubmenu } from "../close-only-submenu";

@Component({
  selector: "app-notification-item",
  standalone: true,
  imports: [
    MatBadgeModule,
    FontAwesomeModule,
    MatMenu,
    MatButtonModule,
    MatMenuTrigger,
    MatMenuItem,
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
  @Output() readStatusChange = new EventEmitter<boolean>();
  @Output() deleteClick = new EventEmitter<void>();
  protected readonly closeOnlySubmenu = closeOnlySubmenu;

  updateReadStatus(newStatus: boolean) {
    this.readStatusChange.emit(newStatus);
  }

  handleDeleteNotification() {
    this.deleteClick.emit();
  }
}
