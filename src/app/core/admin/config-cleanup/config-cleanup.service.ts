import { Injectable, inject } from "@angular/core";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

export interface ConfigurableEnumUsage {
  entityType: string;
  fieldId: string;
}

export interface ConfigurableEnumUsageSummary {
  enumEntity: ConfigurableEnum;
  usages: ConfigurableEnumUsage[];
}

export interface ConfigCleanupAnalysis {
  totalEnums: number;
  usedEnums: number;
  usedEnumDetails: ConfigurableEnumUsageSummary[];
  unusedEnums: ConfigurableEnumUsageSummary[];
}

@Injectable({ providedIn: "root" })
export class ConfigCleanupService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entitySchemaService = inject(EntitySchemaService);

  async analyzeUnusedConfigurableEnums(): Promise<ConfigCleanupAnalysis> {
    const enumEntities = await this.entityMapper.loadType(ConfigurableEnum);
    const usageMap = this.getSchemaUsageByEnumId();

    const enumSummaries = enumEntities
      .map((enumEntity) => ({
        enumEntity,
        usages: usageMap.get(enumEntity.getId(true)) ?? [],
      }))
      .sort((a, b) =>
        a.enumEntity.getId(true).localeCompare(b.enumEntity.getId(true)),
      );

    const usedEnumDetails = enumSummaries.filter(
      (enumSummary) => enumSummary.usages.length > 0,
    );
    const unusedEnums = enumSummaries.filter(
      (enumSummary) => enumSummary.usages.length === 0,
    );

    return {
      totalEnums: enumEntities.length,
      usedEnums: usedEnumDetails.length,
      usedEnumDetails,
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
      this.collectEnumUsagesFromSchema(
        entity.ENTITY_TYPE,
        entity.schema,
        "",
        usageMap,
      );
    }

    return usageMap;
  }

  private collectEnumUsagesFromSchema(
    entityType: string,
    schema: EntitySchema,
    fieldPrefix: string,
    usageMap: Map<string, ConfigurableEnumUsage[]>,
  ) {
    for (const [fieldId, schemaField] of schema.entries()) {
      const fullFieldId = fieldPrefix ? `${fieldPrefix}.${fieldId}` : fieldId;
      this.collectEnumUsageFromField(
        entityType,
        fullFieldId,
        schemaField,
        usageMap,
      );
    }
  }

  private collectEnumUsageFromField(
    entityType: string,
    fieldId: string,
    schemaField: EntitySchemaField,
    usageMap: Map<string, ConfigurableEnumUsage[]>,
  ) {
    if (!schemaField) {
      return;
    }

    if (schemaField.dataType === "configurable-enum") {
      const enumId = this.normalizeEnumId(schemaField.additional);
      if (enumId) {
        const currentUsages = usageMap.get(enumId) ?? [];
        currentUsages.push({ entityType, fieldId });
        usageMap.set(enumId, currentUsages);
      }
    }

    const embeddedSchema = this.getEmbeddedSchema(schemaField);
    if (!embeddedSchema || embeddedSchema.size === 0) {
      return;
    }

    this.collectEnumUsagesFromSchema(
      entityType,
      embeddedSchema,
      fieldId,
      usageMap,
    );
  }

  private getEmbeddedSchema(
    schemaField: EntitySchemaField,
  ): EntitySchema | undefined {
    if (!schemaField?.dataType) {
      return;
    }

    const datatype = this.entitySchemaService.getDatatypeOrDefault(
      schemaField.dataType,
      true,
    ) as { embeddedType?: { schema: EntitySchema } } | undefined;

    const hasEmbeddedType = !!datatype?.embeddedType?.schema;
    const isSchemaEmbed = schemaField.dataType === "schema-embed";

    if (!hasEmbeddedType && !isSchemaEmbed) {
      return;
    }

    const embeddedSchema = new Map<string, EntitySchemaField>();

    for (const [key, value] of datatype?.embeddedType?.schema?.entries() ??
      []) {
      embeddedSchema.set(key, { ...value, id: key });
    }

    for (const [key, value] of Object.entries(
      this.getAdditionalSchemaConfig(schemaField.additional),
    )) {
      embeddedSchema.set(key, { ...value, id: key });
    }

    return embeddedSchema;
  }

  private getAdditionalSchemaConfig(additional: unknown): {
    [fieldId: string]: EntitySchemaField;
  } {
    if (
      !additional ||
      typeof additional !== "object" ||
      Array.isArray(additional)
    ) {
      return {};
    }

    return additional as { [fieldId: string]: EntitySchemaField };
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
