import { Injectable, inject } from "@angular/core";
import { ConfigurableEnum } from "./configurable-enum";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

import { EntityAbility } from "../../permissions/ability/entity-ability";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "./configurable-enum.types";
import { resolveActiveText } from "../../language/active-locale";

@Injectable({ providedIn: "root" })
export class ConfigurableEnumService {
  private entityMapper = inject(EntityMapperService);
  private ability = inject(EntityAbility);

  private enums = new Map<string, ConfigurableEnum>();

  constructor() {
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

  /**
   * The options with their labels resolved to the active language, as copies so
   * the cached entity keeps every language (#3862). Ids are never translated.
   * Use {@link getEnum} when the enum is to be edited and saved.
   */
  getEnumValues<T extends ConfigurableEnumValue = ConfigurableEnumValue>(
    id: string,
  ): T[] {
    const configurableEnum = this.getEnum(id);
    if (!configurableEnum) {
      return [];
    }

    return configurableEnum.values.map((option) => ({
      ...option,
      label: resolveActiveText(option.label),
    })) as T[];
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
