import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
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
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { Config } from "../../../core/config/config";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";

/**
 * UI for current user to configure individual notification settings.
 */
@Component({
  selector: "app-notification-settings",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    FeatureDisabledInfoComponent,
  ],
  templateUrl: "./notification-settings.component.html",
  styleUrl: "./notification-settings.component.scss",
})
export class NotificationSettingsComponent implements OnInit {
  notificationConfig = signal<NotificationConfig>(null);
  isFeatureEnabled = signal<boolean>(false);
  isBrowserSupported = signal<boolean>(false);
  isPushNotificationEnabled = signal<boolean>(false);

  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly userEntity = inject(CurrentUserSubject);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly notificationService = inject(NotificationService);
  private readonly alertService = inject(AlertService);

  /**
   * Get the logged-in user id
   */
  private get userId() {
    return this.sessionInfo.value?.id;
  }

  async ngOnInit() {
    this.isFeatureEnabled.set(
      await this.notificationService.isNotificationServerEnabled(),
    );

    this.isBrowserSupported.set(
      this.notificationService.isPushNotificationSupported(),
    );

    this.notificationConfig.set(await this.loadNotificationConfig());

    this.isPushNotificationEnabled.set(
      this.notificationService.hasNotificationPermissionGranted() &&
        (await this.notificationService.isDeviceRegistered()),
    );
  }

  private async loadNotificationConfig() {
    let notificationConfig: NotificationConfig;
    try {
      notificationConfig =
        await this.notificationService.loadNotificationConfig(this.userId);
    } catch (err) {
      if (err.status === 404) {
        notificationConfig = await this.createNewNotificationConfig();
      } else {
        Logging.warn(err);
      }
    }

    return notificationConfig;
  }

  private async createNewNotificationConfig(): Promise<NotificationConfig> {
    if (!this.isFeatureEnabled()) {
      // do not create a new config if the API is not enabled
      return;
    }

    let config: NotificationConfig;

    try {
      // try to load template from database
      let templateRules = (
        await this.entityMapper.load<
          Config<{ notificationRules: NotificationRule[] }>
        >(Config, NotificationConfig.TEMPLATE_ENTITY_ID)
      )?.data?.["notificationRules"];

      // replace user entity in template rules
      templateRules = JSON.parse(
        JSON.stringify(templateRules).replace(
          PLACEHOLDERS.CURRENT_USER,
          this.userEntity.value?.getId(),
        ),
      );

      config = new NotificationConfig(this.userId);
      config.notificationRules = templateRules;
    } catch (err) {
      Logging.debug("No NotificationConfig template found");

      // use fixed default config as fallback
      config = generateDefaultNotificationConfig(
        this.userId,
        this.userEntity.value?.getId(),
      );
    }

    await this.saveNotificationConfig(config);
    this.alertService.addInfo(
      $localize`Initial notification settings created and saved.`,
    );

    return config;
  }

  async togglePushNotifications(event: MatSlideToggleChange) {
    let enabled = event.checked;
    if (enabled) {
      this.notificationService.registerDevice();
    } else {
      this.notificationService.unregisterDevice();
    }
    this.isPushNotificationEnabled.set(enabled);

    // we do not add "push" channel to this.notificationConfig.channels
  }

  private async saveNotificationConfig(config: NotificationConfig) {
    try {
      await this.entityMapper.save(config);
    } catch (err) {
      Logging.error(err.message);
    }
  }

  async addNewNotificationRule() {
    const config = this.notificationConfig();
    const newRule: NotificationRule = {
      notificationType: "entity_change",
      entityType: undefined,
      channels: config.channels, // by default, use the global channels
      conditions: {},
      enabled: true,
    };

    if (!config.notificationRules) {
      config.notificationRules = [];
    }
    config.notificationRules = [...config.notificationRules, newRule];
    this.notificationConfig.set(config);

    // saving this only once the fields are actually edited by the user
  }

  async updateNotificationRule(
    notificationRule: NotificationRule,
    updatedRule: NotificationRule,
  ) {
    Object.assign(notificationRule, updatedRule);
    await this.saveNotificationConfig(this.notificationConfig());
  }

  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete notification rule`,
      $localize`Are you sure you want to remove this notification rule?`,
    );
    if (confirmed) {
      const config = this.notificationConfig();
      config.notificationRules = config.notificationRules.filter(
        (_, i) => i !== index,
      );
      this.notificationConfig.set(config);
      await this.saveNotificationConfig(config);
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

function generateDefaultNotificationConfig(userId: string, userEntity: string) {
  userEntity = String(userEntity); // ensure that even "undefined" is added as a string so that the structure of conditions remains

  const config = new NotificationConfig(userId);
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
      conditions: { assignedTo: { $elemMatch: userEntity } },
      enabled: !!userEntity,
    },
    {
      label: $localize`:Default notification rule label:Notes involving me`,
      notificationType: "entity_change",
      entityType: "Note",
      changeType: ["created", "updated"],
      conditions: { authors: { $elemMatch: userEntity } },
      enabled: false,
    },
  ];
  return config;
}
