import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { DatabaseEntity } from "../entity/database-entity.decorator";

/**
 * The class which represents the config for the application.
 */
@DatabaseEntity("Config")
export class Config extends Entity {
  /**
   * This field contains all the configuration and does not have a predefined type.
   */
  @DatabaseField({ dataType: "default" }) data: any;
}
