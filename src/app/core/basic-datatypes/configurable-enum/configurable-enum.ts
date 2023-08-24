import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { DatabaseField } from "../../entity/database-field.decorator";

@DatabaseEntity("ConfigurableEnum")
export class ConfigurableEnum extends Entity {
  @DatabaseField() values: ConfigurableEnumValue[] = [];
}
