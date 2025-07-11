import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { NotificationType } from "./notification-config";
import { EntityNotificationContext } from "./entity-notification-context";

/**
 * This represents one specific notification event for one specific user,
 * displayed in the UI through the notification indicator in the toolbar.
 */
@DatabaseEntity("NotificationEvent")
export class NotificationEvent extends Entity {
  static override isInternalEntity = true;

  // notification events are stored in a separate, user-specific database
  static override readonly DATABASE = "notifications";

  /*
   * The title of the notification.
   */
  @DatabaseField() title: string;

  /*
   * The body of the notification.
   */
  @DatabaseField() body: string;

  /*
   * The URL to redirect the user to when the notification is clicked.
   */
  @DatabaseField() actionURL?: string;

  /*
   * The type of notification.
   */
  @DatabaseField() notificationType: NotificationType;

  /*
   * Additional context about the notification,
   * like details about the entity that the notification is about.
   *
   * Introduce additional context interfaces for other NotificationTypes in the future.
   */
  @DatabaseField() context?: EntityNotificationContext;

  /*
   * The status of the notification.
   */
  @DatabaseField() readStatus?: boolean;
}
