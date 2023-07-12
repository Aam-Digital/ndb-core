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
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ImportMetadata, ImportSettings } from "./import-metadata";

@Injectable()
export class ImportService {
  readonly dateDataTypes = [
    dateEntitySchemaDatatype,
    dateOnlyEntitySchemaDatatype,
    monthEntitySchemaDatatype,
    dateWithAgeEntitySchemaDatatype,
  ].map((dataType) => dataType.name);

  constructor(private entityMapper: EntityMapperService) {}

  getMappingComponent(schema: EntitySchemaField) {
    return this.getImportMapping(schema)?.mappingCmp;
  }

  getMappingFunction(schema: EntitySchemaField) {
    return this.getImportMapping(schema)?.mappingFn;
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
    const savedDocs = await this.entityMapper.saveAll(entitiesToImport);
    // TODO: execute additional import actions; see former DataImportService .linkEntities .linkToSchool .linkToActivity
    return await this.saveImportHistory(savedDocs, settings);
  }

  private async saveImportHistory(savedDocs: any[], settings: ImportSettings) {
    const importMeta = new ImportMetadata();
    importMeta.config = settings;
    importMeta.ids = savedDocs.map((entity) => entity["_id"]);
    await this.entityMapper.save(importMeta);
    return importMeta;
  }

  undoImport(item: ImportMetadata) {
    // TODO: implement undo of import
  }
}
