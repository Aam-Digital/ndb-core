import { Injectable } from "@angular/core";
import { ConfigService } from "../config/config.service";
import { ConfigurableEnum } from "./configurable-enum";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { Entity } from "../entity/model/entity";

@Injectable({ providedIn: "root" })
export class ConfigurableEnumService {
  private enums = new Map<string, ConfigurableEnum>();

  constructor(
    private entityMapper: EntityMapperService,
    configService: ConfigService
  ) {
    configService.configUpdates.subscribe(() => this.preLoadEnums());
    this.entityMapper
      .receiveUpdates(ConfigurableEnum)
      .subscribe(({ entity }) => this.cacheEnum(entity));
  }

  async preLoadEnums() {
    const allEnums = await this.entityMapper.loadType(ConfigurableEnum);
    allEnums.forEach((entity) => this.cacheEnum(entity));
  }

  private cacheEnum(entity: ConfigurableEnum) {
    return this.enums.set(entity.getId(true), entity);
  }

  getEnumValues<T extends ConfigurableEnumValue = ConfigurableEnumValue>(
    id: string
  ): T[] {
    return this.getEnum(id).values as T[];
  }

  getEnum(id: string): ConfigurableEnum {
    const entityId = Entity.createPrefixedId(ConfigurableEnum.ENTITY_TYPE, id);
    return this.enums.get(entityId);
  }
}
