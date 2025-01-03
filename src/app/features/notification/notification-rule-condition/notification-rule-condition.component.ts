import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-notification-rule-condition",
  standalone: true,
  imports: [MatSelectModule, FormsModule, CommonModule],
  templateUrl: "./notification-rule-condition.component.html",
})
export class NotificationRuleConditionComponent {
  operators = [
    { label: "Equals", value: "$eq" },
    { label: "Greater Than", value: "$gt" },
    { label: "Less Than", value: "$lt" },
    { label: "Regex Match", value: "$regex" },
  ];

  @Input() selectedNotificationMethod: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(this.selectedNotificationMethod);
  }
}
