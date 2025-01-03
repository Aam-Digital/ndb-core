import { Component, OnInit } from "@angular/core";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
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
import { NotificationMethodSelectComponent } from "../notification-method-select/notification-method-select.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  NotificationConfig,
  NotificationRule,
} from "app/features/notification/model/notification-config";
import { SessionSubject } from "app/core/session/auth/session-info";
import { AlertService } from "app/core/alerts/alert.service";
import { NotificationRuleConditionComponent } from "app/features/notification/notification-rule-condition/notification-rule-condition.component";

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
    NotificationMethodSelectComponent,
    ReactiveFormsModule,
    NotificationRuleConditionComponent,
  ],
  templateUrl: "./notification-setting.component.html",
  styleUrl: "./notification-setting.component.scss",
})
export class NotificationSettingComponent implements OnInit {
  notificationSetting = new FormGroup({
    notificationRules: new FormArray([]),
  });
  allNotificationRules: NotificationConfig = null;
  hasPushNotificationEnabled = false;
  notificationMethods = ["Push"];
  hasNotificationRuleEnabled = false;
  hasNotificationCenterPush = false;

  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initializeNotificationSettings();
  }

  private async initializeNotificationSettings() {
    this.allNotificationRules = await this.loadNotificationConfig();
    if (this.allNotificationRules) {
      this.hasPushNotificationEnabled = this.allNotificationRules.channels.push;
      this.populateNotificationRules(
        this.allNotificationRules.notificationRules,
      );
    } else {
      this.addNewNotificationRule();
    }
  }

  private populateNotificationRules(rules: NotificationRule[] = []): void {
    rules.forEach((rule) => {
      const newNotificationRule = this.createNotificationRuleFormGroup(rule);
      this.notificationRules.push(newNotificationRule);
    });
  }

  get notificationRules(): FormArray {
    return this.notificationSetting.get("notificationRules") as FormArray;
  }

  getFormField(index: number, fieldName: string): FormControl {
    return this.notificationRules.at(index).get(fieldName) as FormControl;
  }

  private async loadNotificationConfig() {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        this.userId,
      );
    } catch {
      return null;
    }
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
  addNewNotificationRule() {
    const newRule = this.createNotificationRuleFormGroup();
    this.notificationRules.push(newRule);
  }

  async onEnableNotification(event: MatSlideToggleChange) {
    const config = await this.loadNotificationConfig();
    this.hasPushNotificationEnabled = event.checked;

    if (config) {
      config.channels.push = this.hasPushNotificationEnabled;
      await this.saveNotificationConfig(config);
    } else {
      await this.createAndSaveNotificationConfig(
        this.hasPushNotificationEnabled,
      );
    }

    this.alertService.addInfo(
      `Notifications ${this.hasPushNotificationEnabled ? "enabled" : "disabled"}.`,
    );
  }

  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete notification rule`,
      $localize`Are you sure you want to remove this notification rule?`,
    );
    if (confirmed) {
      await this.removeNotificationRule(index);
      return true;
    }
    return false;
  }

  private async removeNotificationRule(index: number) {
    const config = await this.loadNotificationConfig();
    if (config) {
      config.notificationRules.splice(index, 1);
      await this.saveNotificationConfig(config);
      this.notificationRules.removeAt(index);
      this.alertService.addInfo(`Notification rule deleted successfully.`);
    }
  }

  private async saveNotificationConfig(config: NotificationConfig) {
    try {
      await this.entityMapper.save(config);
    } catch (error) {
      throw error;
    }
  }

  private async createAndSaveNotificationConfig(pushEnabled: boolean) {
    const newConfig = new NotificationConfig(this.userId);
    newConfig.notificationRules = [this.createNotificationType()];
    newConfig.channels = { push: pushEnabled };
    await this.saveNotificationConfig(newConfig);
  }

  private createNotificationType(entityType: string = ""): NotificationRule {
    return {
      notificationType: "entity_change",
      enabled: this.hasNotificationRuleEnabled,
      channels: { push: this.hasNotificationCenterPush },
      entityType,
      conditions: {},
    };
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

    userNotificationConfig
      ? await this.updateExistingNotificationConfig(
          userNotificationConfig,
          selectedEntity,
          index,
        )
      : await this.createAndSaveNewNotificationConfig(selectedEntity);

    this.alertService.addInfo($localize`Notification Settings updated`);
  }

  async enableNotificationRule(event: MatSlideToggleChange, index: number) {
    this.hasNotificationRuleEnabled = event.checked;
    const userNotificationConfig = await this.loadNotificationConfig();
    const updatedNotificationType = this.createNotificationType("");

    await this.saveOrUpdateNotificationRule(userNotificationConfig, index, {
      enabled: this.hasNotificationRuleEnabled,
      notificationType: updatedNotificationType,
    });

    this.alertService.addInfo($localize`Enable notification rule.`);
  }

  private async saveOrUpdateNotificationRule(
    userNotificationConfig: NotificationConfig | null,
    index: number,
    update: {
      enabled?: boolean;
      notificationType?: NotificationRule;
      push?: boolean;
    },
  ) {
    const notificationRules = userNotificationConfig?.notificationRules || [];

    if (notificationRules[index]) {
      if (update.enabled !== undefined)
        notificationRules[index].enabled = update.enabled;
      if (update.push !== undefined)
        notificationRules[index].channels.push = update.push;
    } else {
      notificationRules.push(update.notificationType);
    }

    if (userNotificationConfig) {
      userNotificationConfig.notificationRules = notificationRules;
      await this.entityMapper.save(userNotificationConfig);
    } else {
      await this.createAndSaveNotificationConfigWithRule(update.push || false);
    }
  }

  private async createAndSaveNotificationConfigWithRule(push: boolean) {
    const newUserNotificationConfig = new NotificationConfig(this.userId);
    newUserNotificationConfig.notificationRules = [
      this.createNotificationType(""),
    ];
    newUserNotificationConfig.channels = { push };
    await this.entityMapper.save(newUserNotificationConfig);
  }

  private createNotificationRuleFormGroup(rule?: NotificationRule): FormGroup {
    return new FormGroup({
      entityType: new FormControl(rule?.entityType || ""),
      notificationRuleCondition: new FormControl(""),
      notificationMethod: new FormControl(rule?.channels.push ? "Push" : ""),
      enabled: new FormControl(rule?.enabled || false),
    });
  }

  getNotificationRuleEnabled(index: number): boolean {
    return this.allNotificationRules?.notificationRules[index]?.enabled;
  }

  async updateNotificationCenter(event: string[], index: number) {
    const userNotificationConfig = await this.loadNotificationConfig();
    this.hasNotificationCenterPush = event.some((item: string) =>
      this.notificationMethods.includes(item),
    );
    await this.saveOrUpdateNotificationRule(userNotificationConfig, index, {
      notificationType: this.createNotificationType(""),
      push: this.hasNotificationCenterPush,
    });

    this.alertService.addInfo($localize`Notification Center Updated.`);
  }

  private async updateExistingNotificationConfig(
    userNotificationConfig: NotificationConfig,
    selectedEntity: any,
    index: number,
  ) {
    const notificationRules = userNotificationConfig.notificationRules || [];

    if (notificationRules[index]) {
      notificationRules[index].entityType = selectedEntity;
    } else {
      notificationRules.push(this.createNotificationType(selectedEntity));
    }

    userNotificationConfig.notificationRules = notificationRules;
    await this.entityMapper.save(userNotificationConfig);
  }

  private async createAndSaveNewNotificationConfig(selectedEntity: any) {
    const newUserNotificationConfig = new NotificationConfig(this.userId);

    newUserNotificationConfig.notificationRules = [
      this.createNotificationType(selectedEntity),
    ];

    await this.entityMapper.save(newUserNotificationConfig);
  }
}
