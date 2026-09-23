import { Injectable, inject } from "@angular/core";
import { ConfigurableEnum } from "./configurable-enum";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

import { EntityAbility } from "../../permissions/ability/entity-ability";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "./configurable-enum.types";
import { resolveLocaleText } from "../../language/active-locale";

function sameOptions(
  a: readonly ConfigurableEnumValue[],
  b: readonly ConfigurableEnumValue[],
): boolean {
  return a.length === b.length && a.every((option, i) => option === b[i]);
}

@Injectable({ providedIn: "root" })
export class ConfigurableEnumService {
  private entityMapper = inject(EntityMapperService);
  private ability = inject(EntityAbility);

  private enums = new Map<string, ConfigurableEnum>();

  /** resolved options per enum, with the raw list they were built from */
  private resolvedValues = new Map<
    string,
    { source: ConfigurableEnumValue[]; resolved: ConfigurableEnumValue[] }
  >();

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
   * the cached entity keeps every language. Ids are never translated.
   * Use {@link getEnum} when the enum is to be edited and saved.
   *
   * Resolved once per enum, not per call: this sits on a per-record hot path,
   * and switching language reloads the page, so it cannot go stale.
   */
  getEnumValues<T extends ConfigurableEnumValue = ConfigurableEnumValue>(
    id: string,
  ): T[] {
    const configurableEnum = this.getEnum(id);
    if (!configurableEnum) {
      return [];
    }

    const key = configurableEnum.getId();
    const options = configurableEnum.values;
    const cached = this.resolvedValues.get(key);
    if (cached && sameOptions(cached.source, options)) {
      return cached.resolved as T[];
    }

    const resolved = options.map((option) => ({
      ...option,
      label: resolveLocaleText(option.label),
    }));
    // snapshot, because editing an enum mutates the live list in place
    this.resolvedValues.set(key, { source: [...options], resolved });
    return resolved as T[];
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
