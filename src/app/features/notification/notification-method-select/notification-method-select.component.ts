import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { NotificationChannel } from "../model/notification-config";

@Component({
  standalone: true,
  imports: [MatSelectModule, FormsModule, CommonModule],
  selector: "app-notification-method-select",
  templateUrl: "./notification-method-select.component.html",
})
export class NotificationMethodSelectComponent {
  notificationMethods: { key: NotificationChannel; label: string }[] = [
    { key: "push", label: $localize`:notification method option:Push` },
  ];

  @Input() label: string =
    $localize`:notification method select label:Notification method`;
  @Input() selectedNotificationMethod: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<NotificationChannel[]>();

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event.value);
  }
}
