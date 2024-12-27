import { Component, OnInit } from "@angular/core";
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
import { NotificationRuleConditionComponent } from "app/features/notification/notification-rule-condition/notification-rule-condition.component";

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
    NotificationRuleConditionComponent,
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent implements OnInit {
  notificationSetting = new FormGroup({
    notificationRules: new FormArray([]),
  });
  allNotificationRules = null;
  pushNotificationsEnabled = false;
  notificationMethods = ["Push", "Email"];

  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.init();
  }

  private async init() {
    this.allNotificationRules = await this.loadNotificationConfig();
    if (this.allNotificationRules) {
      this.pushNotificationsEnabled = this.allNotificationRules.channels.push;
      this.populateNotificationRules();
    } else {
      this.addNewRule();
    }
  }

  private populateNotificationRules() {
    if (
      this.allNotificationRules &&
      this.allNotificationRules.notificationTypes
    ) {
      this.allNotificationRules.notificationTypes.forEach(
        (notificationType: any, index: number) => {
          const newRule = this.createNotificationRuleFormGroup();

          this.notificationRules.push(newRule);

          this.getFormField(index, "entityType").setValue(
            notificationType.entityType,
          );
          this.getFormField(index, "enabled").setValue(
            notificationType.enabled,
          );
        },
      );
    }
  }

  /**
   * Adds a new notification rule and initializes its default values.
   */
  addNewRule() {
    const newRule = this.createNotificationRuleFormGroup();
    this.notificationRules.push(newRule);
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
   * Get the logged in user id
   */
  private get userId(): string | undefined {
    return this.sessionInfo.value?.id;
  }

  /**
   * Loads the user's notification configuration.
   */
  private async loadNotificationConfig() {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        this.userId,
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Opens a confirmation dialog, and removes the notification
   * rule at the specified index.
   * @param index The index of the notification rule to remove
   */
  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete notification rule`,
      $localize`Are you sure you want to remove this notification rule?`,
    );
    if (confirmed) {
      await this.deleteNotificationRule(index);
      this.notificationRules.removeAt(index);
      return true;
    }
    return false;
  }

  private async deleteNotificationRule(index: number) {
    const userNotificationConfig = await this.loadNotificationConfig();
    if (userNotificationConfig) {
      const notificationTypes = userNotificationConfig.notificationTypes || [];
      notificationTypes.splice(index, 1);
      userNotificationConfig.notificationTypes = notificationTypes;
      await this.entityMapper.save(userNotificationConfig);
      this.alertService.addInfo(
        $localize`Notification rule deleted successfully`,
      );
    }
  }

  /**
   * Enables or disables notifications
   */
  async onEnableNotification(event: MatSlideToggleChange) {
    const userNotificationConfig = await this.loadNotificationConfig();
    const pushEnabled = event.checked;

    if (userNotificationConfig) {
      userNotificationConfig.channels.push = pushEnabled;
      await this.entityMapper.save(userNotificationConfig);
    } else {
      await this.createAndSaveNotificationConfigWithRule(pushEnabled);
    }

    this.alertService.addInfo($localize`Notifications enabled.`);
  }

  /**
   * Sends a test notification.
   */
  testNotification() {
    // TODO: Implement the test notification logic.
    Logging.log("Notification settings test successful.");
  }

  async updateNotificationSettingField(index: number, fieldName: string) {
    const userNotificationConfig = await this.loadNotificationConfig();
    const selectedEntity = this.notificationRules
      .at(index)
      .get(fieldName).value;
    if (userNotificationConfig) {
      await this.updateExistingNotificationConfig(
        userNotificationConfig,
        selectedEntity,
        index,
      );
    } else {
      await this.createAndSaveNewNotificationConfig(selectedEntity);
    }

    this.alertService.addInfo($localize`Notification Settings updated`);
  }

  private async updateExistingNotificationConfig(
    userNotificationConfig: NotificationConfig,
    value: string,
    index: number,
  ) {
    const notificationTypes = userNotificationConfig.notificationTypes || [];
    if (notificationTypes.length) {
      notificationTypes[index] = this.createNotificationType(value);
    } else {
      notificationTypes.push(this.createNotificationType(value));
    }

    userNotificationConfig.notificationTypes = notificationTypes;
    userNotificationConfig.channels = { ...userNotificationConfig.channels };

    try {
      await this.entityMapper.save(userNotificationConfig);
    } catch (error) {
      if (error.message.includes("conflict")) {
        const latestConfig = await this.entityMapper.load(
          NotificationConfig,
          this.userId,
        );
        await this.updateExistingNotificationConfig(latestConfig, value, index);
      } else {
        throw error;
      }
    }
  }

  private async createAndSaveNewNotificationConfig(value: string) {
    const userNotificationConfig = new NotificationConfig(this.userId);
    userNotificationConfig.notificationTypes = [
      this.createNotificationType(value),
    ];
    userNotificationConfig.channels = { push: false, email: false };
    await this.entityMapper.save(userNotificationConfig);
  }

  private createNotificationType(value: string) {
    return {
      notificationType: "entity-update",
      enabled: true,
      channels: { push: true, email: false },
      entityType: value,
      conditions: {},
    };
  }

  async enableNotificationRule(event: MatSlideToggleChange, index: number) {
    const userNotificationConfig = await this.loadNotificationConfig();
    const updatedNotificationType = this.createNotificationType("");

    if (userNotificationConfig) {
      const notificationTypes = userNotificationConfig.notificationTypes || [];
      if (notificationTypes[index]) {
        notificationTypes[index].enabled = event.checked;
      } else {
        notificationTypes.push(updatedNotificationType);
      }

      userNotificationConfig.notificationTypes = notificationTypes;
      await this.entityMapper.save(userNotificationConfig);
    } else {
      await this.createAndSaveNotificationConfigWithRule(event.checked);
    }

    this.alertService.addInfo($localize`Enable notification rule.`);
  }

  private async createAndSaveNotificationConfigWithRule(push: boolean) {
    const newUserNotificationConfig = new NotificationConfig(this.userId);
    newUserNotificationConfig.notificationTypes = [
      this.createNotificationType(""),
    ];
    newUserNotificationConfig.channels = { push, email: false };
    await this.entityMapper.save(newUserNotificationConfig);
  }

  private createNotificationRuleFormGroup() {
    return new FormGroup({
      entityType: new FormControl(""),
      notificationRuleCondition: new FormControl(""),
      notificationMethod: new FormControl("Push"),
      enabled: new FormControl(false),
    });
  }

  getNotificationRuleEnabled(index: number): boolean {
    return this.allNotificationRules?.notificationTypes[index]?.enabled;
  }
}
