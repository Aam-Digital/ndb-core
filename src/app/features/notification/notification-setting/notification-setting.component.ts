import { Component } from "@angular/core";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { NgIf } from "@angular/common";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import { FormArray, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { NotificationCenterSelectComponent } from "app/features/notification/notification-center-select/notification-center-select.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: "app-notification-setting",
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
    EntityTypeSelectComponent,
    HelpButtonComponent,
    NotificationCenterSelectComponent,
    ReactiveFormsModule,
  ],
  templateUrl: "./notification-setting.component.html",
  styleUrl: "./notification-setting.component.scss",
})
export class NotificationSettingsComponent {
  hasPushNotificationEnabled: boolean = false;
  notificationSetting = new FormGroup({
    notificationRules: new FormArray([]),
  });

  constructor(private confirmationDialog: ConfirmationDialogService) {
    this.addNewNotificationRule();
  }

  /**
   * Adds a new notification rule and initializes its default values.
   */
  addNewNotificationRule() {
    // TODO: Update this Form Group when we implement the logic to dynamically update the notification notificationRules.
    const newRule = new FormGroup({
      entityType: new FormControl(""),
      notificationRuleCondition: new FormControl(""),
      notificationMethod: new FormControl("Push"),
      enabled: new FormControl(false),
    });

    (this.notificationSetting.get("notificationRules") as FormArray).push(
      newRule,
    );
  }

  /**
   * Gets the FormArray of notification rules.
   * This is used to access the collection of individual notification rules in the form group.
   */
  get notificationRules(): FormArray {
    return this.notificationSetting.get("notificationRules") as FormArray;
  }

  /**
   * Retrieves the FormControl for the form field at a specified index.
   * This allows accessing and manipulating the form field within a specific notification rule.
   */
  getFormField(index: number, fieldName: string): FormControl {
    return this.notificationRules.at(index).get(fieldName) as FormControl;
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

    (this.notificationSetting.get("notificationRules") as FormArray).removeAt(
      index,
    );
    return true;
  }

  /**
   * Enables or disables notifications and updates the backend.
   * @param index The index of the notification rule being toggled.
   */
  onEnableNotification() {
    // TODO: Implement the logic to enable the notification for user and update the value in CouchDB backend.
    this.hasPushNotificationEnabled = !this.hasPushNotificationEnabled;
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
