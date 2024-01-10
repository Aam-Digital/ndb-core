import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { DatabaseEntity } from "../entity/database-entity.decorator";

/**
 * The class which represents the config for the application.
 */
@DatabaseEntity("Config")
export class Config<T = any> extends Entity {
  /**
   * The ID for the UI and data-model config
   */
  static readonly CONFIG_KEY = "CONFIG_ENTITY";

  /**
   * The ID for the permission configuration
   */
  static readonly PERMISSION_KEY = "Permissions";

  /**
   * This field contains all the configuration and does not have a predefined type.
   */
  @DatabaseField() data: T;

  constructor(id = Config.CONFIG_KEY, configuration?: T) {
    super(id);
    this.data = configuration;
  }

  override copy(): this {
    const newConfig = super.copy();
    newConfig.data = JSON.parse(JSON.stringify(this.data));
    return newConfig;
  }
}
