import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";

/**
 * This represents one specific notification config for one specific user,
 */
@DatabaseEntity("NotificationConfig")
export class NotificationConfig extends Entity {
  @DatabaseField() channels: { [key: string]: boolean };

  @DatabaseField() notificationTypes: NotificationType[];

  constructor(id = null) {
    super(id);
  }
}

/**
 * Represents a specific notification type configuration.
 */
export class NotificationType {
  @DatabaseField() notificationType: string;
  @DatabaseField() enabled: boolean;
  @DatabaseField() channels: { [key: string]: boolean };
  @DatabaseField() entityType: string;
  @DatabaseField() conditions: any;
}
