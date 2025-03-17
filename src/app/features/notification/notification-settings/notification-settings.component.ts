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
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { NotificationService } from "../notification.service";
import { MatAccordion } from "@angular/material/expansion";
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
    CdkAccordionModule,
    MatAccordion,
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
    private notificationService: NotificationService,
    private alertService: AlertService,
  ) {}

  /**
   * Get the logged-in user id
   */
  private get userId() {
    return this.sessionInfo.value?.id;
  }

  async ngOnInit() {
    this.notificationConfig = await this.loadNotificationConfig();

    if (this.notificationService.hasNotificationPermissionGranted()) {
      this.isPushNotificationEnabled =
        this.notificationConfig.channels?.push || false;
    }
  }

  private async loadNotificationConfig() {
    let notificationConfig: NotificationConfig;
    try {
      notificationConfig =
        await this.notificationService.loadNotificationConfig();
    } catch (err) {
      if (err.status === 404) {
        notificationConfig = this.generateDefaultNotificationConfig();
        await this.saveNotificationConfig(notificationConfig);
        this.alertService.addInfo(
          $localize`Initial notification settings created and saved.`,
        );
      } else {
        Logging.warn(err);
      }
    }

    return notificationConfig;
  }

  private generateDefaultNotificationConfig(): NotificationConfig {
    const config = new NotificationConfig(this.userId);

    config.notificationRules = [
      {
        label: $localize`:Default notification rule label:a new Child being registered`,
        notificationType: "entity_change",
        entityType: "Child",
        changeType: ["created"],
        conditions: {},
        enabled: true,
      },
      {
        label: $localize`:Default notification rule label:Tasks assigned to me`,
        notificationType: "entity_change",
        entityType: "Todo",
        changeType: ["created", "updated"],
        conditions: { assignedTo: { $elemMatch: this.userId } },
        enabled: true,
      },
      {
        label: $localize`:Default notification rule label:Notes involving me`,
        notificationType: "entity_change",
        entityType: "Note",
        changeType: ["created", "updated"],
        conditions: { authors: { $elemMatch: this.userId } },
        enabled: false,
      },
    ];

    return config;
  }

  async togglePushNotifications(event: MatSlideToggleChange) {
    if (event.checked) {
      this.notificationService.registerDevice();
    } else {
      this.notificationService.unregisterDevice();
    }
    this.isPushNotificationEnabled = event?.checked;

    this.notificationConfig.channels = {
      ...this.notificationConfig.channels,
      push: this.isPushNotificationEnabled,
    };

    await this.saveNotificationConfig(this.notificationConfig);
  }

  private async saveNotificationConfig(config: NotificationConfig) {
    try {
      await this.entityMapper.save(config);
    } catch (err) {
      Logging.error(err.message);
    }
  }

  async addNewNotificationRule() {
    const newRule: NotificationRule = {
      notificationType: "entity_change",
      entityType: undefined,
      channels: this.notificationConfig.channels, // by default, use the global channels
      conditions: {},
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
      this.notificationConfig.notificationRules.splice(index, 1);
      await this.saveNotificationConfig(this.notificationConfig);
      return true;
    }
    return false;
  }

  /**
   * Sends a test push-notification.
   */
  testNotification() {
    this.notificationService.testNotification().catch((reason) => {
      Logging.error("Could not send test notification: " + reason.message);
    });
  }
}
