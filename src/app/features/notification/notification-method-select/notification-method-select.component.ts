import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";

@Component({
  standalone: true,
  imports: [MatSelectModule, FormsModule, CommonModule],
  selector: "app-notification-method-select",
  templateUrl: "./notification-method-select.component.html",
})
export class NotificationMethodSelectComponent {
  notificationMethods: string[] = ["Push"];
  @Input() label: string;
  @Input() selectedNotificationMethod: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event.value);
  }
}
