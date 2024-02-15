import { Injectable } from "@angular/core";
import { ConfigurableEnum } from "./configurable-enum";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { Entity } from "../../entity/model/entity";

@Injectable({ providedIn: "root" })
export class ConfigurableEnumService {
  private enums = new Map<string, ConfigurableEnum>();

  constructor(
    private entityMapper: EntityMapperService,
    private ability: EntityAbility,
  ) {
    this.entityMapper
      .receiveUpdates(ConfigurableEnum)
      .subscribe(({ entity }) => this.cacheEnum(entity));
  }

  async preLoadEnums() {
    const allEnums = await this.entityMapper.loadType(ConfigurableEnum);
    allEnums.forEach((entity) => this.cacheEnum(entity));
  }

  private cacheEnum(entity: ConfigurableEnum) {
    return this.enums.set(entity.getId(), entity);
  }

  getEnumValues<T extends ConfigurableEnumValue = ConfigurableEnumValue>(
    id: string,
  ): T[] {
    const configurableEnum = this.getEnum(id);
    return configurableEnum ? (configurableEnum.values as T[]) : [];
  }

  getEnum(id: string): ConfigurableEnum | undefined {
    if (!this.enums) {
      return;
    }
    const entityId = Entity.createPrefixedId(ConfigurableEnum.ENTITY_TYPE, id);
    if (
      !this.enums.has(entityId) &&
      this.ability.can("create", ConfigurableEnum)
    ) {
      const newEnum = new ConfigurableEnum(id);
      this.cacheEnum(newEnum);
    }
    return this.enums.get(entityId);
  }

  listEnums() {
    return Array.from(this.enums.keys());
  }
}
