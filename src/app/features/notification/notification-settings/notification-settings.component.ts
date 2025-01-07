import { Component, OnInit } from "@angular/core";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
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
import { MatTooltip } from "@angular/material/tooltip";
import { AlertService } from "../../../core/alerts/alert.service";

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
    MatTooltip,
  ],
  templateUrl: "./notification-settings.component.html",
  styleUrl: "./notification-settings.component.scss",
})
export class NotificationSettingsComponent implements OnInit {
  notificationConfig: NotificationConfig = null;
  isPushNotificationEnabled = false;

  constructor(
    private entityMapper: EntityMapperService,
    private sessionInfo: SessionSubject,
    private confirmationDialog: ConfirmationDialogService,
    private alertService: AlertService,
  ) {}

  /**
   * Get the logged-in user id
   */
  private get userId() {
    return this.sessionInfo.value?.id;
  }

  async ngOnInit() {
    await this.initializeNotificationSettings();
  }

  private async initializeNotificationSettings() {
    this.notificationConfig = await this.loadNotificationConfig();

    if (this.notificationConfig) {
      this.isPushNotificationEnabled =
        this.notificationConfig?.channels?.push || false;
    }
  }

  private async loadNotificationConfig() {
    try {
      return await this.entityMapper.load<NotificationConfig>(
        NotificationConfig,
        this.userId,
      );
    } catch (err) {
      Logging.debug(err);

      if (err.status === 404) {
        return new NotificationConfig(this.userId);
      }
    }
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

  private async saveNotificationConfig(config: NotificationConfig) {
    await this.entityMapper.save(config);
    this.alertService.addInfo($localize`Notification settings saved.`);
  }

  async addNewNotificationRule() {
    const newRule: NotificationRule = {
      notificationType: "entity_change",
      entityType: undefined,
      channels: undefined,
      conditions: undefined,
      enabled: true,
    };

    if (!this.notificationConfig.notificationRules) {
      this.notificationConfig.notificationRules = [];
    }
    this.notificationConfig.notificationRules.push(newRule);

    // saving this only once the fields are actually edited by the user
  }

  async updateNotificationRule(
    notificationRule: NotificationRule,
    updatedRule: NotificationRule,
  ) {
    Object.assign(notificationRule, updatedRule);
    await this.saveNotificationConfig(this.notificationConfig);
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
    this.notificationConfig.notificationRules.splice(index, 1);
    await this.saveNotificationConfig(this.notificationConfig);
  }
}
