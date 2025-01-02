import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";

/**
 * This represents one specific notification event for one specific user,
 * displayed in the UI through the notification indicator in the toolbar.
 */
@DatabaseEntity("NotificationEvent")
export class NotificationEvent extends Entity {
  @DatabaseField() title: string;
  @DatabaseField() body: string;
  @DatabaseField() actionURL: string;
  @DatabaseField() notificationFor: string;
  @DatabaseField() notificationToken: string;
  @DatabaseField() readStatus: boolean;
}