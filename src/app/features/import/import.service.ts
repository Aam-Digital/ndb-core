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
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";

@Injectable()
export class ImportService {
  readonly dateDataTypes = [
    dateEntitySchemaDatatype,
    dateOnlyEntitySchemaDatatype,
    monthEntitySchemaDatatype,
    dateWithAgeEntitySchemaDatatype,
  ].map((dataType) => dataType.name);

  private linkableEntities: {
    [key: string]: { [key: string]: (e: any[], link: string) => Promise<any> };
  } = {
    [Child.ENTITY_TYPE]: {
      [RecurringActivity.ENTITY_TYPE]: this.linkToActivity.bind(this),
      [School.ENTITY_TYPE]: this.linkToSchool.bind(this),
    },
  };

  constructor(private entityMapper: EntityMapperService) {}

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
        mappingFn: (val, additional) => additional[val],
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

  private linkEntities(entities: any[], settings: ImportSettings) {
    return Promise.all(
      settings.additionalActions.map(({ type, id }) =>
        this.linkableEntities[settings.entityType][type](entities, id)
      )
    );
  }

  private linkToSchool(entities: any[], link: string) {
    const relations = entities.map((entity) => {
      const relation = new ChildSchoolRelation();
      relation.childId = Entity.extractEntityIdFromId(entity._id);
      relation.schoolId = link;
      return relation;
    });
    return this.entityMapper.saveAll(relations);
  }

  private async linkToActivity(entities: any[], link: string) {
    const activity = await this.entityMapper.load(RecurringActivity, link);
    const ids = entities.map((e) => Entity.extractEntityIdFromId(e._id));
    activity.participants.push(...ids);
    return this.entityMapper.save(activity);
  }

  undoImport(item: ImportMetadata) {
    // TODO: implement undo of import
  }
}
