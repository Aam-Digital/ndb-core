import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DataFilter } from "app/core/filter/filters/filters";

/**
 * This represents one specific notification config for one specific user,
 */
@DatabaseEntity("NotificationConfig")
export class NotificationConfig extends Entity {
  /**
   * The default mode(s) through which all notifications are sent to the user.
   *
   * Can be overwritten for each notificationType to disable a channel for certain notifications.
   * If the channel is not activated globally here, the individual override has no effect, however.
   */
  @DatabaseField() channels: { [key in NotificationChannel]?: boolean };

  /**
   * Specific rules to trigger notifications.
   */
  @DatabaseField() notificationRules: NotificationRule[];

  /**
   * The "id" must be the user account ID to which this config relates.
   */
  constructor(id: string) {
    super(id);
  }

  /**
   * Helper method to access the user ID for whom this config is.
   */
  getUserId(): string {
    return this.getId();
  }
}

/**
 * Defines allowed notification channels.
 */
export type NotificationChannel = "push";

/**
 * Represents a specific notification type configuration.
 */
export class NotificationRule {
  /** The general type of notification (e.g. changes to entities, etc.) */
  @DatabaseField() notificationType: NotificationType;

  /** whether this notification is enabled or currently "paused" */
  @DatabaseField() enabled: boolean;

  /**
   * override for the global notification channel(s).
   * e.g. define here if this specific notification rule should not show as email/push notification
   */
  @DatabaseField() channels: { [key in NotificationChannel]?: boolean };

  /** (for "entity_change" notifications only): type of entities that can trigger notification */
  @DatabaseField() entityType: string;

  /** (for "entity_change" notifications only): conditions which changes cause notifications */
  @DatabaseField() conditions: DataFilter<any>;
}

/**
 * Base type of notification rule.
 */
export type NotificationType = "entity_change";
