import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { Papa, ParseResult } from "ngx-papaparse";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BackupService } from "../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { readFile } from "../../utils/utils";
import { ImportMetaData } from "./import-meta-data.type";
import { v4 as uuid } from "uuid";
import { CsvValidationStatus } from "./csv-validation-Status.enum";
import { CsvValidationResult } from "./csv-validation-result.type";
import { DynamicEntityService } from "../../core/entity/dynamic-entity.service";

@Injectable()
@UntilDestroy()
export class DataImportService {
  constructor(
    private db: Database,
    private papa: Papa,
    private backupService: BackupService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private dynamicEntityService: DynamicEntityService
  ) {}

  async validateCsvFile(file: File, entityType: string): Promise<CsvValidationResult> {
    const csvData = await readFile(file);
    const parsedCsvFile = this.parseCsvFile(csvData);

    if (parsedCsvFile === undefined || parsedCsvFile.data === undefined) {
      return {status: CsvValidationStatus.ErrorNoData, resultMessage: 'The file provided is invalid, parsing was not possible!'};
    }

    if (parsedCsvFile.data.length === 0) {
      return {status: CsvValidationStatus.ErrorEmpty, resultMessage: 'The file provided is invalid, it has no content!'};
    }

    if (parsedCsvFile.meta.fields.includes("_id")) {
      const record = parsedCsvFile.data[0];

      if (!record["_id"].startsWith(entityType + ":")) {
        return {status: CsvValidationStatus.ErrorWrongType, resultMessage: 'The file provided is invalid, it contains an _id column but the given type does not match the selected type!'};
      }
    }

    return {status: CsvValidationStatus.Valid, resultMessage: 'The file provided is valid.'};
  }

  parseCsvFile(csv: string): ParseResult {
    return this.papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
  }

  async importCsvContentToDB(csv: string, importMeta: ImportMetaData): Promise<void> {
    const parsedCsv = this.parseCsvFile(csv);

    // e.g. Child:abcd1234
    const recordIdPrefix = importMeta.entityType + ":" + importMeta.transactionId;

    // remove existing records, if any
    // there is a chance of collision
    const existingRecords = await this.db.getAll(recordIdPrefix);

    for (const record of existingRecords) {
      await this.db.remove(record);
    }

    let hasIdProperty = true;

    if (!parsedCsv.meta.fields.includes("_id")) {
      hasIdProperty = false;
      parsedCsv.meta.fields.push("_id");
    }

    for (const record of parsedCsv.data) {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null || propertyName === "_rev") {
          delete record[propertyName];
        }
      }

      // generate new _id as there is none
      if (!hasIdProperty) {
        const newUUID = uuid();
        const idProperty = recordIdPrefix + newUUID.substring(8);

        record["_id"] = idProperty;
      }

      if (record["_id"] !== undefined) {
        const entityType = record["_id"].split(":")[0];
        const ctor = this.dynamicEntityService.getEntityConstructor(entityType);
        record["searchIndices"] = Object.assign(
          new ctor(),
          record
        ).searchIndices;
      }
      await this.db.put(record, true);
    }
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * @param file The file object of the csv data to be loaded
   */
  async handleCsvImport(file: Blob, importMeta: ImportMetaData): Promise<void> {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await readFile(file);

    const refTitle = $localize`Import new data?`;
    const refText = $localize`Are you sure you want to import this file? This will add or update ${
        newData.trim().split("\n").length - 1
      } records from the loaded file. All existing records imported with the transaction id '${importMeta.transactionId}' will be deleted!`;

    const dialogRef = this.confirmationDialog.openDialog(
      refTitle,
      refText
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      await this.importCsvContentToDB(newData, importMeta);

      const snackBarRef = this.snackBar.open(
        $localize`Import completed?`,
        "Undo",
        {
          duration: 8000,
        }
      );
      snackBarRef
        .onAction()
        .pipe(untilDestroyed(this))
        .subscribe(async () => {
          await this.backupService.clearDatabase();
          await this.backupService.importJson(restorePoint, true);
        });
    });
  }
}
