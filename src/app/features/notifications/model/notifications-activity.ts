import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";

@DatabaseEntity("Notification")
export class NotificationActivity extends Entity {
  @DatabaseField({ dataType: "string" }) title: string;
  @DatabaseField({ dataType: "string" }) body: string;
  @DatabaseField({ dataType: "string" }) type: string;
  @DatabaseField({ dataType: "string" }) actionURL: string;

  @DatabaseField({ dataType: "string" }) sentBy: string;
  @DatabaseField({ dataType: "string" }) readStatus: string;
  @DatabaseField({ dataType: "string" }) delivery: string;
  @DatabaseField({ dataType: "string" }) context: string;

  public override toString(): string {
    return `Notification: ${this.title} - ${this.body}`;
  }
}
