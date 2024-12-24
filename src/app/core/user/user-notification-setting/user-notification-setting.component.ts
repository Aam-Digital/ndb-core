import { Component } from "@angular/core";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { NgFor, NgIf } from "@angular/common";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { NotificationCenterSelectComponent } from "app/features/notification/notification-center-select/notification-center-select.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: "app-user-notification-setting",
  standalone: true,
  imports: [
    MatSlideToggle,
    MatInputModule,
    FontAwesomeModule,
    FormsModule,
    MatFormFieldModule,
    MatTooltip,
    FaIconComponent,
    MatButtonModule,
    MatTooltipModule,
    NgIf,
    EntityTypeSelectComponent,
    HelpButtonComponent,
    NotificationCenterSelectComponent,
    ReactiveFormsModule,
    NgFor,
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent {
  notificationRules = [
    {
      notificationRuleCondition: "",
      notificationMethod: "Push",
      enabled: false,
    },
  ];
  notificationOptions = ["Push", "Email"];

  notificationSetting = new FormGroup({
    entityType: new FormControl<string>(""),
    notificationRuleCondition: new FormControl<string>(""),
    notificationMethod: new FormControl<string>("Push"),
    enabled: new FormControl<boolean>(false),
  });

  constructor(private confirmationDialog: ConfirmationDialogService) {}

  /**
   * Adds a new notification rule and initializes its default values.
   */
  addNewRule() {
    const newRule = {
      notificationRuleCondition: "",
      notificationMethod: "Push",
      enabled: false,
    };
    this.notificationRules.push(newRule);
  }

  /**
   * Opens a confirmation dialog, and removes the notification
   * rule at the specified index.
   * @param index The index of the notification rule to remove
   */
  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      "Delete notification rule",
      "Are you sure you want to remove this notification rule?",
    );

    if (!confirmed) {
      return;
    }

    this.notificationRules.splice(index, 1);
    return true;
  }

  /**
   * Enables or disables notifications and updates the backend.
   * @param index The index of the notification rule being toggled.
   */
  onEnableNotification() {
    // TODO: Implement the logic to enable the notification for user and update the value in CouchDB backend.
    Logging.log("Browser notifications toggled.");
  }

  /**
   * Sends a test notification.
   */
  testNotification() {
    // TODO: Implement the logic to test the notification setting.
    Logging.log("Notification settings test successful.");
  }
}
