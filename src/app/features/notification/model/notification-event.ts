import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { NotificationType } from "./notification-config";

/**
 * This represents one specific notification event for one specific user,
 * displayed in the UI through the notification indicator in the toolbar.
 */
@DatabaseEntity("NotificationEvent")
export class NotificationEvent extends Entity {
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
  @DatabaseField() actionURL: string;

  /*
   * The user ID for whom the notification is intended
   */
  @DatabaseField() notificationFor: string;

  /*
   * The notification token to be used for the notification.
   */
  @DatabaseField() notificationToken: string;

  /*
   * The type of notification.
   */
  @DatabaseField() notificationType: NotificationType;

  /*
   * The entity type of the notification.
   */
  @DatabaseField() entityType: string;

  /*
   * The status of the notification.
   */
  @DatabaseField() readStatus: boolean;
}
