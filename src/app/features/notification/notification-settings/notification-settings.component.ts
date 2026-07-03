import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  linkedSignal,
  resource,
  untracked,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
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
import { UnsavedChangesService } from "../../../core/entity-details/form/unsaved-changes.service";

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
export class NotificationSettingsComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly userEntity = inject(CurrentUserSubject);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  protected readonly notificationService = inject(NotificationService);
  private readonly alertService = inject(AlertService);
  protected readonly unsavedChanges = inject(UnsavedChangesService);

  constructor() {
    // clear this component's unsaved-changes state when it is destroyed
    inject(DestroyRef).onDestroy(() =>
      this.unsavedChanges.setUnsavedChanges(this, false),
    );
  }

  readonly accountEmail = toSignal(this.sessionInfo.pipe(map((s) => s?.email)));

  private readonly notificationConfigResource = resource({
    loader: () => untracked(() => this.loadNotificationConfig()),
  });
  notificationConfig = linkedSignal(
    () => this.notificationConfigResource.value() ?? null,
  );

  private readonly isDeviceRegisteredResource = resource({
    loader: async () =>
      untracked(() =>
        this.notificationService.hasNotificationPermissionGranted(),
      ) && (await this.notificationService.isDeviceRegistered()),
  });
  isPushNotificationEnabled = linkedSignal(
    () => this.isDeviceRegisteredResource.value() ?? false,
  );

  /**
   * Get the logged-in user id
   */
  private get userId() {
    return this.sessionInfo.value?.id;
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
    if (!this.notificationService.isNotificationServerEnabled()) {
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

    const saved = await this.saveNotificationConfig(config);
    if (!saved) return;
    this.alertService.addInfo(
      $localize`Initial notification settings created and saved.`,
    );

    return config;
  }

  toggleEmailChannel(event: MatSlideToggleChange) {
    this.notificationConfig.update((config) => {
      const clone = Object.assign(
        Object.create(Object.getPrototypeOf(config)),
        config,
      );
      clone.channels = { ...config.channels, email: event.checked };
      return clone;
    });
    this.unsavedChanges.setUnsavedChanges(this, true);
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

  private async saveNotificationConfig(
    config: NotificationConfig,
  ): Promise<boolean> {
    try {
      await this.entityMapper.save(config);
      return true;
    } catch (err) {
      Logging.error(err.message);
      return false;
    }
  }

  addNewNotificationRule() {
    const newRule: NotificationRule = {
      notificationType: "entity_change",
      entityType: undefined,
      channels: this.notificationConfig().channels, // by default, use the global channels
      conditions: {},
      enabled: true,
    };

    this.notificationConfig.update((config) => {
      const clone = Object.assign(
        Object.create(Object.getPrototypeOf(config)),
        config,
      );
      clone.notificationRules = [...(config.notificationRules ?? []), newRule];
      return clone;
    });
    this.unsavedChanges.setUnsavedChanges(this, true);
  }

  updateNotificationRule(
    notificationRule: NotificationRule,
    updatedRule: NotificationRule,
  ) {
    this.notificationConfig.update((config) => {
      const clone = Object.assign(
        Object.create(Object.getPrototypeOf(config)),
        config,
      );
      clone.notificationRules = (config.notificationRules ?? []).map((rule) =>
        rule === notificationRule ? { ...rule, ...updatedRule } : rule,
      );
      return clone;
    });
    this.unsavedChanges.setUnsavedChanges(this, true);
  }

  async saveSettings() {
    const saved = await this.saveNotificationConfig(this.notificationConfig());
    if (!saved) return;
    this.unsavedChanges.setUnsavedChanges(this, false);
    this.alertService.addInfo($localize`Notification settings saved.`);
  }

  async confirmRemoveNotificationRule(index: number) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete notification rule`,
      $localize`Are you sure you want to remove this notification rule?`,
    );
    if (confirmed) {
      this.notificationConfig.update((config) => {
        const clone = Object.assign(
          Object.create(Object.getPrototypeOf(config)),
          config,
        );
        clone.notificationRules = (config.notificationRules ?? []).filter(
          (_, i) => i !== index,
        );
        return clone;
      });
      const saved = await this.saveNotificationConfig(
        this.notificationConfig(),
      );
      if (!saved) return false;
      this.unsavedChanges.setUnsavedChanges(this, false);
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
