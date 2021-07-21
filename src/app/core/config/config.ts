import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { DatabaseEntity } from "../entity/database-entity.decorator";

/**
 * The class which represents the config for the application.
 */
@DatabaseEntity("Config")
export class Config extends Entity {
  /**
   * The key of the ID of the config for the database
   */
  static readonly CONFIG_KEY = "CONFIG_ENTITY";

  /**
   * This field contains all the configuration and does not have a predefined type.
   */
  @DatabaseField({ dataType: "default" }) data: any;

  constructor(configuration?: any) {
    super(Config.CONFIG_KEY);
    this.data = configuration;
  }
}
