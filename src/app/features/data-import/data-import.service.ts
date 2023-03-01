import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { BackupService } from "../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ImportMetaData } from "./import-meta-data.type";
import { v4 as uuid } from "uuid";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { dateEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date";
import { dateOnlyEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date-only";
import { monthEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-month";
import moment from "moment";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { dateWithAgeEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date-with-age";
import { isArrayDataType } from "../../core/entity-components/entity-utils/entity-utils";
import { School } from "../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { Child } from "app/child-dev-project/children/model/child";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";

/**
 * This service handels the parsing of CSV files and importing of data
 */
@Injectable({ providedIn: "root" })
export class DataImportService {
  private readonly dateDataTypes = [
    dateEntitySchemaDatatype,
    dateOnlyEntitySchemaDatatype,
    monthEntitySchemaDatatype,
    dateWithAgeEntitySchemaDatatype,
  ].map((dataType) => dataType.name);

  private linkableEntities: {
    [key: string]: [
      EntityConstructor,
      (e: any[], link: string) => Promise<any>
    ][];
  } = {
    [Child.ENTITY_TYPE]: [
      [RecurringActivity, this.linkToActivity.bind(this)],
      [School, this.linkToSchool.bind(this)],
    ],
  };

  constructor(
    private db: Database,
    private backupService: BackupService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService
  ) {}

  getLinkableEntityTypes(linkEntity: string): string[] {
    return (
      this.linkableEntities[linkEntity]?.map(
        ([entity]) => entity.ENTITY_TYPE
      ) ?? []
    );
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * If a transactionId is provided in the ImportMetaData, all records starting with this ID will be deleted from the database before importing
   * @param data The objects parsed from a file to be loaded
   * @param importMeta Additional information required for importing the file
   */
  async handleCsvImport(
    data: any[],
    importMeta: ImportMetaData
  ): Promise<void> {
    const restorePoint = await this.backupService.getDatabaseExport();
    const confirmed = await this.getUserConfirmation(data, importMeta);
    if (!confirmed) {
      return;
    }

    if (importMeta.transactionId) {
      await this.deleteExistingRecords(importMeta);
    }

    await this.importCsvContentToDB(data, importMeta);

    const snackBarRef = this.snackBar.open(
      $localize`Import completed`,
      $localize`Undo`,
      {
        duration: 8000,
      }
    );
    snackBarRef.onAction().subscribe(async () => {
      await this.backupService.clearDatabase();
      await this.backupService.restoreData(restorePoint, true);
    });
  }

  private getUserConfirmation(
    data: any[],
    importMeta: ImportMetaData
  ): Promise<boolean> {
    const refTitle = $localize`Import new data?`;
    let refText = $localize`Are you sure you want to import this file?
      This will add or update ${data.length} records from the loaded file.`;
    if (importMeta.transactionId) {
      refText = $localize`${refText} All existing records imported with the transaction id '${importMeta.transactionId}' will be deleted!`;
    }
    return this.confirmationDialog.getConfirmation(refTitle, refText);
  }

  private async deleteExistingRecords(importMeta: ImportMetaData) {
    const existing = await this.db.getAll(
      Entity.createPrefixedId(importMeta.entityType, importMeta.transactionId)
    );
    return Promise.all(existing.map((entity) => this.db.remove(entity)));
  }

  private async importCsvContentToDB(
    data: any[],
    importMeta: ImportMetaData
  ): Promise<void> {
    const entities = data.map((row) => {
      const entity = this.createEntityWithRowData(row, importMeta);
      this.createSearchIndices(importMeta, entity);
      if (!entity["_id"]) {
        entity["_id"] = `${importMeta.entityType}:${
          importMeta.transactionId
        }-${uuid().substring(9)}`;
      }
      return entity;
    });
    await this.db.putAll(entities);

    if (importMeta.linkEntity?.id) {
      await this.linkEntities(entities, importMeta);
    }
  }

  private createEntityWithRowData(row: any, importMeta: ImportMetaData): any {
    const rawEntity = {};
    const schema = this.entities.get(importMeta.entityType).schema;
    Object.keys(row)
      .filter((col) => importMeta.columnMap[col])
      .forEach((col) => {
        const property = importMeta.columnMap[col];
        const propertyValue = this.getPropertyValue(
          property.key,
          row[col],
          importMeta,
          schema.get(property.key).dataType
        );
        if (propertyValue !== undefined) {
          rawEntity[property.key] = propertyValue;
        }
      });
    return rawEntity;
  }

  private getPropertyValue(
    property: string,
    value: any,
    importMeta: ImportMetaData,
    dataType: string
  ): any {
    if (property === "_id") {
      return Entity.createPrefixedId(importMeta.entityType, value);
    } else if (importMeta.dateFormat && this.dateDataTypes.includes(dataType)) {
      return this.transform2Date(value, importMeta.dateFormat);
    } else if (isArrayDataType(dataType)) {
      return this.parseArrayValue(value);
    } else {
      return value;
    }
  }

  private parseArrayValue(value: any) {
    if (!value) {
      return undefined;
    }
    try {
      const res = JSON.parse(value);
      if (Array.isArray(res)) {
        return res;
      } else {
        return [res];
      }
    } catch (e) {
      return (value as string).split(",").map((res) => res.trim());
    }
  }

  private transform2Date(value: any, dateFormat: string) {
    const date = moment(value, dateFormat);
    if (date.isValid()) {
      return date.format("YYYY-MM-DD");
    } else {
      return undefined;
    }
  }

  private createSearchIndices(importMeta: ImportMetaData, entity) {
    const ctor = this.entities.get(importMeta.entityType);
    entity["searchIndices"] = Object.assign(new ctor(), entity).searchIndices;
  }

  private linkEntities(entities: any[], importMeta: ImportMetaData) {
    return this.linkableEntities[importMeta.entityType].find(
      ([type]) => type.ENTITY_TYPE === importMeta.linkEntity.type
    )[1](entities, importMeta.linkEntity.id);
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
    const ids = entities.map((entity) =>
      Entity.extractEntityIdFromId(entity._id)
    );
    activity.participants.push(...ids);
    return this.entityMapper.save(activity);
  }
}
