import { Component } from "@angular/core";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
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
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { NotificationConfig } from "app/features/notification/model/notification-config";
import { SessionSubject } from "app/core/session/auth/session-info";
import { AlertService } from "../../alerts/alert.service";

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
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent {
  notificationSetting = new FormGroup({
    notificationRules: new FormArray([]),
  });
  notificationMethods = ["Push", "Email"];

  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private alertService: AlertService,
  ) {
    this.addNewRule();
  }

  /**
   * Get the logged in user id
   */
  private get userId(): string | undefined {
    return this.sessionInfo.value?.id;
  }

  /**
   * Adds a new notification rule and initializes its default values.
   */
  addNewRule() {
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
    Logging.log("Browser notifications toggled.");
  }

  /**
   * Sends a test notification.
   */
  testNotification() {
    Logging.log("Notification settings test successful.");
  }

  /**
   * Loads the user's notification configuration.
   */
  private async loadNotificationConfig(userId: string) {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        userId,
      );
    } catch (error) {
      return null;
    }
  }

  async updateNotificationSettingField(value: string, index: number) {
    const userNotificationConfig = await this.loadNotificationConfig(
      this.userId,
    );

    if (userNotificationConfig) {
      this.updateExistingNotificationConfig(
        userNotificationConfig,
        value,
        index,
      );
    } else {
      this.createAndSaveNewNotificationConfig(value);
    }

    this.alertService.addInfo("Notification Settings updated");
  }

  private updateExistingNotificationConfig(
    config: NotificationConfig,
    value: string,
    index: number,
  ) {
    const notificationTypes = config.notificationTypes || [];
    const updatedNotificationType = this.createNotificationType(value);

    if (notificationTypes.length) {
      notificationTypes[index] = {
        ...notificationTypes[index],
        ...updatedNotificationType,
      };
    } else {
      notificationTypes.push(updatedNotificationType);
    }

    config.notificationTypes = notificationTypes;
    this.entityMapper.save(config);
  }

  private createAndSaveNewNotificationConfig(value: string) {
    const userNotificationConfig = new NotificationConfig(this.userId);
    userNotificationConfig.notificationTypes = [
      this.createNotificationType(value),
    ];
    userNotificationConfig.channels = { push: false, email: false };
    this.entityMapper.save(userNotificationConfig);
  }

  private createNotificationType(value: string) {
    return {
      notificationType: "entity-update",
      enabled: true,
      channels: { push: true, email: true },
      entityType: value.toString(),
      conditions: {},
    };
  }

  enableNotificationRule(event: MatSlideToggleChange, index: number) {
    Logging.log(event.checked ? "Enabled" : "Disabled");
  }
}
