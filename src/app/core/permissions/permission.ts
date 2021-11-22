import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseRules } from "./permission-types";
import { DatabaseField } from "../entity/database-field.decorator";

/**
 * This class holds the permission configuration for the app
 */
@DatabaseEntity("Permission")
export class Permission extends Entity {
  /**
   * The unique key under which the permission object is stored in the database
   */
  static PERMISSION_KEY = "PERMISSION_ENTITY";

  /**
   * The actual rule configuration
   */
  @DatabaseField({ dataType: "default" }) rulesConfig: DatabaseRules;

  constructor(rules: any) {
    super(Permission.PERMISSION_KEY);
    this.rulesConfig = rules;
  }
}
