import { Component, OnInit } from "@angular/core";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { NotificationMethodSelectComponent } from "../notification-method-select/notification-method-select.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  NotificationConfig,
  NotificationRule,
} from "app/features/notification/model/notification-config";
import { SessionSubject } from "app/core/session/auth/session-info";
import { AlertService } from "app/core/alerts/alert.service";

/**
 * UI for current user to configure individual notification settings.
 */
@Component({
  selector: "app-notification-settings",
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
  ],
  templateUrl: "./notification-settings.component.html",
  styleUrl: "./notification-settings.component.scss",
})
export class NotificationSettingsComponent implements OnInit {
  notificationSetting = new FormGroup({
    notificationRules: new FormArray([]),
  });
  allNotificationRules: NotificationConfig = null;
  isPushNotificationEnabled: boolean = false;
  isNotificationRuleConfigured: boolean = false;
  isNotificationMethodPushAllowed: boolean = false;
  selectedNotificationEntity: string = null;

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
    this.isPushNotificationEnabled =
      this.allNotificationRules?.channels.push || false;
    if (this.allNotificationRules) {
      this.populateNotificationRules(
        this.allNotificationRules.notificationRules,
      );
    }
  }

  private populateNotificationRules(
    notificationRules: NotificationRule[] = [],
  ) {
    notificationRules.forEach((notificationRule) => {
      const newNotificationRule =
        this.initializeNotificationRuleFormGroup(notificationRule);
      this.isNotificationRuleConfigured = notificationRule.enabled;
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
    } catch (err) {
      Logging.debug(err);
    }
  }

  /**
   * Get the logged in user id
   */
  private get userId() {
    return this.sessionInfo.value?.id;
  }

  /**
   * Adds a new notification rule and initializes its default values.
   */
  async appendNewNotificationRule() {
    const newRule = this.initializeNotificationRuleFormGroup();
    this.notificationRules.push(newRule);
  }

  async onEnableNotification(event: MatSlideToggleChange) {
    // TODO: If the user to not allow the permission then don't need to update the value.
    const NotificationToken = this.getNotificationToken();
    const notificationConfig = await this.loadNotificationConfig();
    this.isPushNotificationEnabled = event.checked;

    if (notificationConfig?.channels) {
      notificationConfig.channels.push = this.isPushNotificationEnabled;
      await this.saveNotificationConfig(notificationConfig);
    } else {
      await this.createAndSaveNotificationConfig(
        this.isPushNotificationEnabled,
      );
    }

    this.alertService.addInfo(
      $localize`Notifications ${this.isPushNotificationEnabled ? "enabled" : "disabled"}.`,
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
    const notificationConfig = await this.loadNotificationConfig();
    if (notificationConfig?.notificationRules) {
      notificationConfig.notificationRules.splice(index, 1);
      await this.saveNotificationConfig(notificationConfig);
    }
    this.notificationRules.removeAt(index);
    this.alertService.addInfo(
      $localize`Notification rule deleted successfully.`,
    );
  }

  private async createAndSaveNotificationConfig(pushEnabled: boolean) {
    const newConfig = new NotificationConfig(this.userId);
    newConfig.channels = { push: pushEnabled };
    await this.saveNotificationConfig(newConfig);
  }

  private createNotificationRule(): NotificationRule {
    return {
      notificationType: "entity_change",
      enabled: this.isNotificationRuleConfigured,
      channels: { push: this.isNotificationMethodPushAllowed },
      entityType: this.selectedNotificationEntity,
      conditions: {},
    };
  }

  /**
   * Sends a test notification.
   */
  async testNotification() {
    const NotificationToken = this.getNotificationToken();
    // TODO: Implement the test notification logic when the PR #2692 merged, and if the user have notificationToken then only trigger the API call to trigger the test notification.
    Logging.log("Notification settings test successful.");
  }

  async updateNotificationEntityField(index: number, fieldName: string) {
    const userNotificationConfig = await this.loadNotificationConfig();
    this.selectedNotificationEntity = this.notificationRules
      .at(index)
      .get(fieldName).value;
    this.isNotificationMethodPushAllowed =
      this.getFormField(index, "notificationMethod").value || false;
    this.isNotificationRuleConfigured =
      this.getFormField(index, "enabled").value || false;

    const updatedNotificationRules = this.updateOrAddNotificationRule(
      userNotificationConfig?.notificationRules || [],
      index,
    );

    const updatedNotificationConfig: NotificationConfig =
      userNotificationConfig || new NotificationConfig(this.userId);
    updatedNotificationConfig.notificationRules = updatedNotificationRules;
    await this.saveNotificationConfig(updatedNotificationConfig);

    this.alertService.addInfo($localize`Notification entity updated`);
  }

  async enableNotificationRule(event: MatSlideToggleChange, index: number) {
    this.isNotificationRuleConfigured = event.checked;
    const userNotificationConfig = await this.loadNotificationConfig();

    await this.saveOrUpdateNotificationRule(
      userNotificationConfig,
      index,
      this.createNotificationRule(),
    );

    this.alertService.addInfo($localize`Enable notification rule.`);
  }

  private async saveOrUpdateNotificationRule(
    userNotificationConfig: NotificationConfig | null,
    index: number,
    updatedNotificationRule?: NotificationRule,
  ) {
    const rules = userNotificationConfig?.notificationRules || [];

    if (rules[index]) {
      rules[index].enabled = this.isNotificationRuleConfigured;
      rules[index].channels.push = this.isNotificationMethodPushAllowed;
    } else {
      rules.push(updatedNotificationRule);
    }

    if (userNotificationConfig) {
      userNotificationConfig.notificationRules = rules;
      await this.saveNotificationConfig(userNotificationConfig);
    } else {
      await this.initializeAndSaveConfigWithRule();
    }
  }

  private async initializeAndSaveConfigWithRule() {
    const newUserNotificationConfig = new NotificationConfig(this.userId);
    newUserNotificationConfig.notificationRules = [
      this.createNotificationRule(),
    ];
    newUserNotificationConfig.channels = {
      push: this.isPushNotificationEnabled,
    };
    await this.saveNotificationConfig(newUserNotificationConfig);
  }

  private initializeNotificationRuleFormGroup(
    notificationRule: NotificationRule = null,
  ): FormGroup {
    return new FormGroup({
      entityType: new FormControl(notificationRule?.entityType || ""),
      notificationRuleCondition: new FormControl(""),
      notificationMethod: new FormControl(
        notificationRule?.channels.push ? "push" : "",
      ),
      enabled: new FormControl(notificationRule?.enabled || false),
    });
  }

  async updateNotificationCenter(event: string[], index: number) {
    const userNotificationConfig = await this.loadNotificationConfig();
    this.isNotificationMethodPushAllowed = event.includes("push");
    this.isNotificationRuleConfigured =
      this.getFormField(index, "enabled").value || false;
    await this.saveOrUpdateNotificationRule(
      userNotificationConfig,
      index,
      this.createNotificationRule(),
    );

    this.alertService.addInfo($localize`Notification Method Updated.`);
  }

  private updateOrAddNotificationRule(
    rules: NotificationRule[],
    index: number,
  ): NotificationRule[] {
    const updatedRules = [...rules];
    if (updatedRules[index]) {
      updatedRules[index].entityType = this.selectedNotificationEntity;
    } else {
      updatedRules[index] = this.createNotificationRule();
    }
    return updatedRules;
  }

  private async saveNotificationConfig(notificationConfig: NotificationConfig) {
    try {
      await this.entityMapper.save<NotificationConfig>(notificationConfig);
    } catch (err) {
      Logging.debug("Failed to save notification config:", err);
    }
  }

  private async getNotificationToken() {
    // TODO: Need to trigger the getNotificationToken(Implement this when the PR #2692 merged) function to allow the user to browser notification permission and update the notification token.
    Logging.log("Get the notification token.");
  }
}
