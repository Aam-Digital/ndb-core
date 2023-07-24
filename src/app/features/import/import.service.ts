import { Injectable } from "@angular/core";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { EnumValueMappingComponent } from "./import-column-mapping/enum-value-mapping/enum-value-mapping.component";
import { DateValueMappingComponent } from "./import-column-mapping/date-value-mapping/date-value-mapping.component";
import moment from "moment/moment";
import { dateEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date";
import { dateOnlyEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date-only";
import { monthEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-month";
import { dateWithAgeEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date-with-age";
import { ComponentType } from "@angular/cdk/overlay";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Child } from "../../child-dev-project/children/model/child";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { School } from "../../child-dev-project/schools/model/school";
import { Entity } from "../../core/entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";

/**
 * Supporting import of data from spreadsheets.
 */
@Injectable({
  providedIn: "root",
})
export class ImportService {
  readonly dateDataTypes = [
    dateEntitySchemaDatatype,
    dateOnlyEntitySchemaDatatype,
    monthEntitySchemaDatatype,
    dateWithAgeEntitySchemaDatatype,
  ].map((dataType) => dataType.name);

  private linkableEntities: {
    [key: string]: {
      [key: string]: {
        create: (entities: Entity[], id: string) => Promise<any>;
        undo: (importMeta: ImportMetadata, id: string) => Promise<any>;
      };
    };
  } = {
    [Child.ENTITY_TYPE]: {
      [RecurringActivity.ENTITY_TYPE]: {
        create: this.linkToActivity.bind(this),
        undo: this.undoActivityLink.bind(this),
      },
      [School.ENTITY_TYPE]: {
        create: this.linkToSchool.bind(this),
        undo: this.undoSchoolLink.bind(this),
      },
    },
  };

  constructor(
    private entityMapper: EntityMapperService,
    private entityTypes: EntityRegistry,
    private schemaService: EntitySchemaService
  ) {}

  getMappingComponent(schema: EntitySchemaField) {
    return this.getImportMapping(schema)?.mappingCmp;
  }

  getMappingFunction(schema: EntitySchemaField) {
    return this.getImportMapping(schema)?.mappingFn;
  }

  getLinkableEntities(entityType: string): string[] {
    return Object.keys(this.linkableEntities[entityType] ?? {});
  }

  private getImportMapping(schema: EntitySchemaField): {
    mappingCmp: ComponentType<any>;
    mappingFn: (val, additional) => any;
  } {
    if (
      schema.dataType === "boolean" ||
      schema.dataType === "configurable-enum" ||
      schema.innerDataType === "configurable-enum"
    ) {
      return {
        mappingCmp: EnumValueMappingComponent,
        mappingFn: (val, additional) => additional?.[val],
      };
    }
    if (this.dateDataTypes.includes(schema.dataType)) {
      return {
        mappingCmp: DateValueMappingComponent,
        mappingFn: (val, additional) => {
          const date = moment(val, additional, true);
          if (date.isValid()) {
            return date.toDate();
          } else {
            return undefined;
          }
        },
      };
    }
  }

  async executeImport(
    entitiesToImport: Entity[],
    settings: ImportSettings
  ): Promise<ImportMetadata> {
    await this.entityMapper.saveAll(entitiesToImport);
    await this.linkEntities(entitiesToImport, settings);
    return this.saveImportHistory(entitiesToImport, settings);
  }

  private async saveImportHistory(
    savedEntities: Entity[],
    settings: ImportSettings
  ) {
    const importMeta = new ImportMetadata();
    importMeta.config = settings;
    importMeta.ids = savedEntities.map((entity) => entity.getId(true));
    await this.entityMapper.save(importMeta);
    return importMeta;
  }

  private linkEntities(entities: Entity[], settings: ImportSettings) {
    return Promise.all(
      settings.additionalActions?.map(({ type, id }) =>
        this.linkableEntities[settings.entityType][type].create(entities, id)
      ) ?? []
    );
  }

  private linkToSchool(entities: Entity[], id: string) {
    const relations = entities.map((entity) => {
      const relation = new ChildSchoolRelation();
      relation.childId = entity.getId();
      relation.schoolId = id;
      return relation;
    });
    return this.entityMapper.saveAll(relations);
  }

  private async undoSchoolLink(importMeta: ImportMetadata) {
    const relations = await this.entityMapper.loadType(ChildSchoolRelation);
    const imported = relations.filter((rel) =>
      importMeta.ids.includes(Entity.createPrefixedId("Child", rel.childId))
    );
    return Promise.all(imported.map((rel) => this.entityMapper.remove(rel)));
  }

  private async linkToActivity(entities: Entity[], id: string) {
    const activity = await this.entityMapper.load(RecurringActivity, id);
    const ids = entities.map((e) => e.getId());
    activity.participants.push(...ids);
    return this.entityMapper.save(activity);
  }

  private async undoActivityLink(importMeta: ImportMetadata, id: string) {
    const activity = await this.entityMapper.load(RecurringActivity, id);
    activity.participants = activity.participants.filter(
      (p) => !importMeta.ids.includes(Entity.createPrefixedId("Child", p))
    );
    return this.entityMapper.save(activity);
  }

  undoImport(item: ImportMetadata) {
    const removes = item.ids.map((id) =>
      this.entityMapper
        .load(item.config.entityType, id)
        .then((e) => this.entityMapper.remove(e))
        .catch(() => undefined)
    );
    const undoes =
      item.config.additionalActions?.map(({ type, id }) =>
        this.linkableEntities[item.config.entityType][type].undo(item, id)
      ) ?? [];

    // Or should the ImportMetadata still be kept indicating that it has been undone?
    return Promise.all([...removes, ...undoes, this.entityMapper.remove(item)]);
  }

  /**
   * Use the given mapping to transform raw data into Entity instances that can be displayed or saved.
   * @param rawData
   * @param entityType
   * @param columnMapping
   */
  async transformRawDataToEntities(
    rawData: any[],
    entityType: string,
    columnMapping: ColumnMapping[]
  ): Promise<Entity[]> {
    if (!rawData || !entityType || !columnMapping) {
      return [];
    }

    const entityConstructor = this.entityTypes.get(entityType);

    const mappedEntities = rawData.map((row) => {
      const entity = new entityConstructor();
      let hasMappedProperty = false;

      for (const col in row) {
        const mapping: ColumnMapping = columnMapping.find(
          (c) => c.column === col
        );
        if (!mapping) {
          continue;
        }

        const parsed = this.parseRow(row[col], mapping, entity);

        // ignoring falsy values except 0 (=> null, undefined, empty string)
        if (!!parsed || parsed === 0) {
          entity[mapping.propertyName] = parsed;
          hasMappedProperty = true;
        }
      }

      return hasMappedProperty ? entity : undefined;
    });

    return mappedEntities.filter((e) => e !== undefined);
  }

  private parseRow(val: any, mapping: ColumnMapping, entity: Entity) {
    const schema = entity.getSchema().get(mapping.propertyName);

    if (!schema) {
      return undefined;
    }

    const mappingFn = this.getMappingFunction(schema);
    if (mappingFn) {
      return mappingFn(val, mapping.additional);
    } else {
      return this.schemaService
        .getDatatypeOrDefault(schema.dataType)
        .transformToObjectFormat(val, schema, this.schemaService, entity);
    }
  }
}
