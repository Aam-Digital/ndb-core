import { Injectable, inject } from "@angular/core";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";

export interface ConfigurableEnumUsage {
  entityType: string;
  fieldId: string;
}

export interface UnusedConfigurableEnum {
  enumEntity: ConfigurableEnum;
  usages: ConfigurableEnumUsage[];
}

export interface ConfigCleanupAnalysis {
  totalEnums: number;
  usedEnums: number;
  unusedEnums: UnusedConfigurableEnum[];
}

@Injectable({ providedIn: "root" })
export class ConfigCleanupService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);

  async analyzeUnusedConfigurableEnums(): Promise<ConfigCleanupAnalysis> {
    const enumEntities = await this.entityMapper.loadType(ConfigurableEnum);
    const usageMap = this.getSchemaUsageByEnumId();

    const unusedEnums = enumEntities
      .filter((enumEntity) => !usageMap.has(enumEntity.getId(true)))
      .map((enumEntity) => ({
        enumEntity,
        usages: [],
      }))
      .sort((a, b) =>
        a.enumEntity.getId(true).localeCompare(b.enumEntity.getId(true)),
      );

    return {
      totalEnums: enumEntities.length,
      usedEnums: enumEntities.length - unusedEnums.length,
      unusedEnums,
    };
  }

  async deleteUnusedConfigurableEnum(enumEntity: ConfigurableEnum) {
    const usageMap = this.getSchemaUsageByEnumId();
    const enumId = enumEntity.getId(true);

    if (usageMap.has(enumId)) {
      return false;
    }

    await this.entityMapper.remove(enumEntity);
    return true;
  }

  private getSchemaUsageByEnumId(): Map<string, ConfigurableEnumUsage[]> {
    const usageMap = new Map<string, ConfigurableEnumUsage[]>();

    for (const entity of this.entityRegistry.values()) {
      for (const [fieldId, schemaField] of entity.schema.entries()) {
        if (schemaField?.dataType !== "configurable-enum") {
          continue;
        }

        const enumId = this.normalizeEnumId(schemaField.additional);
        if (!enumId) {
          continue;
        }

        const currentUsages = usageMap.get(enumId) ?? [];
        currentUsages.push({ entityType: entity.ENTITY_TYPE, fieldId });
        usageMap.set(enumId, currentUsages);
      }
    }

    return usageMap;
  }

  private normalizeEnumId(rawId: unknown): string | undefined {
    if (typeof rawId !== "string" || rawId.length === 0) {
      return;
    }

    const expectedPrefix = `${ConfigurableEnum.ENTITY_TYPE}:`;
    if (rawId.startsWith(expectedPrefix)) {
      return Entity.extractEntityIdFromId(rawId);
    }

    return rawId;
  }
}