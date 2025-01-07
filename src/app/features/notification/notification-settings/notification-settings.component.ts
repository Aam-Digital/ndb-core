import { Component, OnInit } from "@angular/core";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  NotificationConfig,
  NotificationRule,
} from "app/features/notification/model/notification-config";
import { SessionSubject } from "app/core/session/auth/session-info";
import { NotificationRuleComponent } from "../notification-rule/notification-rule.component";
import { CdkAccordionModule } from "@angular/cdk/accordion";

/**
 * UI for current user to configure individual notification settings.
 */
@Component({
  selector: "app-notification-settings",
  standalone: true,
  imports: [
    MatSlideToggle,
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    HelpButtonComponent,
    NotificationRuleComponent,
    CdkAccordionModule,
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
  isPushNotificationEnabled = false;

  constructor(
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private confirmationDialog: ConfirmationDialogService,
  ) {}

  ngOnInit(): void {
    this.initializeNotificationSettings();
  }

  private async initializeNotificationSettings() {
    this.allNotificationRules = await this.loadNotificationConfig();
    if (this.allNotificationRules) {
      this.isPushNotificationEnabled =
        this.allNotificationRules?.channels?.push || false;
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
      this.notificationRules.push(newNotificationRule);
    });
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

  get notificationRules(): FormArray {
    return this.notificationSetting.get("notificationRules") as FormArray;
  }

  private createNotificationRuleFormGroup(
    rule: NotificationRule = {} as NotificationRule,
  ): FormGroup {
    return new FormGroup({
      notificationEntity: new FormControl(rule.entityType || ""),
      enabled: new FormControl(rule.enabled || false),
      notificationMethod: new FormControl(rule.channels?.push ? "push" : ""),
    });
  }

  getFormField(index: number, fieldName: string): FormControl {
    return this.notificationRules.at(index).get(fieldName) as FormControl;
  }

  getFormFieldControl(index: number) {
    return this.notificationRules.at(index) as FormControl;
  }

  async togglePushNotifications(event: MatSlideToggleChange) {
    this.isPushNotificationEnabled = event.checked;
    let notificationConfig = await this.loadNotificationConfig();

    if (!notificationConfig) {
      notificationConfig = new NotificationConfig(this.userId);
    }

    notificationConfig.channels = {
      ...notificationConfig.channels,
      push: this.isPushNotificationEnabled,
    };

    await this.saveNotificationConfig(notificationConfig);
  }

  async appendNewNotificationRule() {
    this.notificationRules.push(this.createNotificationRuleFormGroup());

    let updatedNotificationConfig = await this.loadNotificationConfig();
    if (!updatedNotificationConfig) {
      updatedNotificationConfig = new NotificationConfig(this.userId);
    }

    updatedNotificationConfig.notificationRules =
      this.getUpdatedNotificationRules();

    await this.saveNotificationConfig(updatedNotificationConfig);
  }

  private getUpdatedNotificationRules() {
    return this.notificationRules.value.map((rule: any) => {
      return {
        notificationType: "entity_change",
        enabled: rule.enabled,
        channels: {
          push: false,
        },
        entityType: rule.notificationEntity,
        conditions: {},
      };
    });
  }

  private async saveNotificationConfig(config: NotificationConfig) {
    try {
      await this.entityMapper.save(config);
    } catch (error) {
      Logging.debug("Failed to save notification config:", error);
    }
  }

  private initializeNotificationRuleFormGroup(
    notificationRule: NotificationRule = null,
  ): FormGroup {
    return new FormGroup({
      notificationEntity: new FormControl(notificationRule?.entityType || ""),
      notificationRuleCondition: new FormControl(""),
      notificationMethod: new FormControl(
        notificationRule?.channels.push ? "push" : "",
      ),
      enabled: new FormControl(notificationRule?.enabled || false),
    });
  }

  async handleNotificationRuleChange($event: string, index: number) {
    const userNotificationConfig = await this.loadNotificationConfig();
    const updatedNotificationRules =
      userNotificationConfig?.notificationRules || [];
    const updatedRules = [...updatedNotificationRules];

    const fieldValue = this.getFormField(index, $event)?.value;

    switch ($event) {
      case "notificationEntity":
        updatedRules[index].entityType = fieldValue;
        break;
      case "enabled":
        updatedRules[index].enabled = fieldValue;
        break;
      case "notificationMethod":
        updatedRules[index].channels.push = fieldValue;
        break;
    }

    const updatedNotificationConfig: NotificationConfig =
      userNotificationConfig || new NotificationConfig(this.userId);
    updatedNotificationConfig.notificationRules = updatedRules;

    await this.saveNotificationConfig(updatedNotificationConfig);
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
  }
}
