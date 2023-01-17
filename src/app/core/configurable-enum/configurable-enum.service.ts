import { Injectable } from "@angular/core";
import { ConfigService } from "../config/config.service";
import { ConfigurableEnum } from "./configurable-enum";
import { EntityMapperService } from "../entity/entity-mapper.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumValue,
} from "./configurable-enum.interface";
import { Entity } from "../entity/model/entity";

@Injectable({ providedIn: "root" })
export class ConfigurableEnumService {
  private enums = new Map<string, ConfigurableEnum>();

  constructor(
    private entityMapper: EntityMapperService,
    configService: ConfigService
  ) {
    configService.configUpdates.subscribe(() => this.preLoadEnums());
  }

  async preLoadEnums() {
    const allEnums = await this.entityMapper.loadType(ConfigurableEnum);
    allEnums.forEach((entity) => this.enums.set(entity.getId(true), entity));
  }

  getEnumValues(id: string): ConfigurableEnumValue[] {
    const entityId = Entity.createPrefixedId(
      ConfigurableEnum.ENTITY_TYPE,
      id.replace(CONFIGURABLE_ENUM_CONFIG_PREFIX, "")
    );
    return this.enums.get(entityId).values;
  }
}
