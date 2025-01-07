import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotificationMethodSelectComponent } from "../notification-method-select/notification-method-select.component";
import { Logging } from "app/core/logging/logging.service";
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";

@Component({
  selector: "app-notification-rule",
  standalone: true,
  imports: [
    MatSlideToggle,
    MatInputModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    EntityTypeSelectComponent,
    HelpButtonComponent,
    NotificationMethodSelectComponent,
    ReactiveFormsModule,
    CdkAccordionModule,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./notification-rule.component.html",
  styleUrl: "../notification-settings/notification-settings.component.scss",
})
export class NotificationRuleComponent {
  @Input() notificationRule: FormControl;
  @Input() accordionIndex: number;
  @Output() notificationRuleChange = new EventEmitter<string>();
  @Output() removeNotificationRule = new EventEmitter<void>();

  notificationConditions: any[] = [];

  getFormField(fieldName: string): FormControl {
    return this.notificationRule.get(fieldName) as FormControl;
  }

  handleNotificationRuleChange(fieldName: string, event?: any) {
    const formField = this.getFormField(fieldName);

    if (event instanceof MatSlideToggleChange) {
      formField.setValue(event.checked);
    } else if (Array.isArray(event)) {
      const fieldValue = event.includes("push");
      formField.setValue(fieldValue);
    } else {
      const entityFieldValue = formField.value;
      if (formField.value !== entityFieldValue) {
        formField.setValue(entityFieldValue);
      }
    }

    this.notificationRuleChange.emit(fieldName);
  }

  removeRule() {
    this.removeNotificationRule.emit();
  }

  /**
   * Sends a test notification.
   */
  async testNotification() {
    const NotificationToken = this.getNotificationToken();
    // TODO: Implement the test notification logic when the PR #2692 merged, and if the user have notificationToken then only trigger the API call to trigger the test notification.
    Logging.log("Notification settings test successful.");
  }

  private async getNotificationToken() {
    // TODO: Need to trigger the getNotificationToken(Implement this when the PR #2692 merged) function to allow the user to browser notification permission and update the notification token.
    Logging.log("Get the notification token.");
  }

  appendNewNotificationCondition(event: MouseEvent) {
    event.stopPropagation();
    this.notificationConditions.push({});
  }
}
