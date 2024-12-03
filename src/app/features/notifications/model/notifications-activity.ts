import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";

@DatabaseEntity("Notification")
export class NotificationActivity extends Entity {
  @DatabaseField({ dataType: "string" }) title: string;
  @DatabaseField({ dataType: "string" }) body: string;
  @DatabaseField({ dataType: "string" }) actionURL: string;

  @DatabaseField({ dataType: "string" }) sentBy: string;
  @DatabaseField({ dataType: "string" }) fcmToken: string;
  @DatabaseField({ dataType: "boolean" }) readStatus: boolean;

  public override toString(): string {
    return `Notification: ${this.title} - ${this.body}`;
  }
}
