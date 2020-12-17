import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "./entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { addPropertySchema } from "./database-field.decorator";

@Injectable({
  providedIn: "root",
})
export class EntityConfigService {
  static readonly PREFIX_ENTITY_CONFIG = "entity:";

  constructor(private configService: ConfigService) {}

  addConfigAttributes<T extends Entity>(entityType: EntityConstructor<T>) {
    const configName =
      EntityConfigService.PREFIX_ENTITY_CONFIG +
      entityType.prototype.constructor.ENTITY_TYPE;
    const entityConfig = this.configService.getConfig<EntityConfig>(configName);
    entityConfig.attributes.forEach((attribute) =>
      addPropertySchema(entityType.prototype, attribute.name, attribute.schema)
    );
  }
}

export class EntityConfig {
  _id: string;
  attributes: { name: string; schema: EntitySchemaField }[];
}
