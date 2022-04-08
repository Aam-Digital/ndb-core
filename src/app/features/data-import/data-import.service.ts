import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { Papa, ParseResult } from "ngx-papaparse";
import { BackupService } from "../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { readFile } from "../../utils/utils";
import { ImportMetaData } from "./import-meta-data.type";
import { v4 as uuid } from "uuid";
import { Entity } from "../../core/entity/model/entity";
import { dateEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date";
import { dateOnlyEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-date-only";
import { monthEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-month";
import moment from "moment";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";

@Injectable()
/**
 * This service handels the parsing of CSV files and importing of data
 */
export class DataImportService {
  private readonly dateDataTypes = [
    dateEntitySchemaDatatype,
    dateOnlyEntitySchemaDatatype,
    monthEntitySchemaDatatype,
  ].map((dataType) => dataType.name);
  constructor(
    private db: Database,
    private papa: Papa,
    private backupService: BackupService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private entities: EntityRegistry
  ) {}

  /**
   * Validates and reads a CSV
   * @param file a File Blob
   */
  async validateCsvFile(file: File): Promise<ParseResult> {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Only .csv files are supported");
    }
    const csvData = await readFile(file);
    const parsedCsvFile = this.parseCsvFile(csvData);

    if (parsedCsvFile === undefined || parsedCsvFile.data === undefined) {
      throw new Error("File could not be parsed");
    }
    if (parsedCsvFile.data.length === 0) {
      throw new Error("File has no content");
    }

    return parsedCsvFile;
  }

  private parseCsvFile(csvString: string): ParseResult {
    return this.papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * If a transactionId is provided in the ImportMetaData, all records starting with this ID will be deleted from the database before importing
   * @param csvFile The file object of the csv data to be loaded
   * @param importMeta Additional information required for importing the file
   */
  async handleCsvImport(
    csvFile: ParseResult,
    importMeta: ImportMetaData
  ): Promise<void> {
    const restorePoint = await this.backupService.getJsonExport();
    const confirmed = await this.getUserConfirmation(csvFile, importMeta);
    if (!confirmed) {
      return;
    }

    if (importMeta.transactionId) {
      await this.deleteExistingRecords(importMeta);
    }

    await this.importCsvContentToDB(csvFile, importMeta);

    const snackBarRef = this.snackBar.open(
      $localize`Import completed?`,
      $localize`Undo`,
      {
        duration: 8000,
      }
    );
    snackBarRef.onAction().subscribe(async () => {
      await this.backupService.clearDatabase();
      await this.backupService.importJson(restorePoint, true);
    });
  }

  private getUserConfirmation(
    csvFile: ParseResult,
    importMeta: ImportMetaData
  ): Promise<boolean> {
    const refTitle = $localize`Import new data?`;
    let refText = $localize`Are you sure you want to import this file?
      This will add or update ${csvFile.data.length} records from the loaded file.`;
    if (importMeta.transactionId) {
      refText = $localize`${refText} All existing records imported with the transaction id '${importMeta.transactionId}' will be deleted!`;
    }
    const dialogRef = this.confirmationDialog.openDialog(refTitle, refText);

    return new Promise<boolean>((resolve) => {
      dialogRef.afterClosed().subscribe((confirmed) => resolve(confirmed));
    });
  }

  private async deleteExistingRecords(importMeta: ImportMetaData) {
    const existing = await this.db.getAll(
      Entity.createPrefixedId(importMeta.entityType, importMeta.transactionId)
    );
    return Promise.all(existing.map((entity) => this.db.remove(entity)));
  }

  private async importCsvContentToDB(
    csv: ParseResult,
    importMeta: ImportMetaData
  ): Promise<void> {
    for (const row of csv.data) {
      const entity = this.createEntityWithRowData(row, importMeta);
      this.createSearchIndices(importMeta, entity);
      if (!entity["_id"]) {
        entity["_id"] = `${importMeta.entityType}:${
          importMeta.transactionId
        }-${uuid().substr(9)}`;
      }
      await this.db.put(entity, true);
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
          property,
          row[col],
          importMeta,
          schema.get(property).dataType
        );
        if (propertyValue !== undefined) {
          rawEntity[property] = propertyValue;
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
    } else {
      return value;
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
}
