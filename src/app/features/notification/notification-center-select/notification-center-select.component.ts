import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";

@Component({
  standalone: true,
  imports: [MatSelectModule, FormsModule, CommonModule],
  selector: "app-notification-center-select",
  templateUrl: "./notification-center-select.component.html",
})
export class NotificationCenterSelectComponent {
  @Input() label: string;
  @Input() selectedOption: string[] = [];
  @Input() options: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();

  onSelectionChange() {
    this.selectionChange.emit(this.selectedOption);
  }
}
