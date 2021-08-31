import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { addPropertySchema } from "./database-field.decorator";
import { OperationType } from "../permissions/entity-permissions.service";

@Injectable({
  providedIn: "root",
})
export class EntityConfigService {
  static readonly PREFIX_ENTITY_CONFIG = "entity:";

  constructor(private configService: ConfigService) {}

  public addConfigAttributes<T extends Entity>(entityType: typeof Entity) {
    const entityConfig = this.getEntityConfig(entityType);
    if (entityConfig?.attributes) {
      entityConfig.attributes.forEach((attribute) =>
        addPropertySchema(
          entityType.prototype,
          attribute.name,
          attribute.schema
        )
      );
    }
  }

  public getEntityConfig(entityType: EntityConstructor<any>): EntityConfig {
    const configName =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityType.ENTITY_TYPE;
    return this.configService.getConfig<EntityConfig>(configName);
  }
}

export interface EntityConfig {
  permissions?: { [key in OperationType]?: string[] };
  attributes?: { name: string; schema: EntitySchemaField }[];
}
