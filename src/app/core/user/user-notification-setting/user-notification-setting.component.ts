import { Component } from "@angular/core";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { NgFor, NgIf } from "@angular/common";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import { FormsModule, FormControl } from "@angular/forms";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { NotificationCenterSelectComponent } from "app/features/notification/notification-center-select/notification-center-select.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";

interface Notification {
  selectedOption: string;
  inputValue: string;
  toggleValue: boolean;
}

@Component({
  selector: "app-user-notification-setting",
  standalone: true,
  imports: [
    MatSlideToggle,
    MatInputModule,
    NgFor,
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
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent {
  notificationRule: Notification[] = [
    { selectedOption: "", inputValue: "", toggleValue: false },
  ];
  notificationOptions = ["Push", "Email"];

  constructor(private confirmationDialog: ConfirmationDialogService) {}

  addNewRule() {
    // TODO: Implement the logic to update the new field and save all the field value in the form control and update in the backend.
    this.notificationRule.push({
      selectedOption: "",
      inputValue: "",
      toggleValue: false,
    });
  }

  /**
   * Opens a confirmation dialog, and removes the notification
   * rule at the specified index.
   * @param index The index of the notification rule to remove
   */
  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      `Delete notification rule`,
      `Are you sure you want to remove this notification rule?`,
    );

    if (!confirmed) {
      return;
    }

    this.notificationRule.splice(index, 1);
    return true;
  }

  onEnableNotification() {
    // TODO: Implement the logic to enable the notification for user and update the value in CouchDB backend.
    Logging.log("Browser notifications toggled.");
  }

  testNotification() {
    // TODO: Implement the logic to test the notification setting.
    Logging.log("Notification settings test successful.");
  }
}
