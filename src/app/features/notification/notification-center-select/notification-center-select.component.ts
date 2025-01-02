import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";

@Component({
  standalone: true,
  imports: [MatSelectModule, FormsModule, CommonModule],
  selector: "app-notification-center-select",
  templateUrl: "./notification-center-select.component.html",
})
export class NotificationCenterSelectComponent {
  @Input() label: string;
  @Input() notificationMethods: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();
  @Input() selectedNotificationMethod: string | string[] = [];

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event.value);
  }
}
