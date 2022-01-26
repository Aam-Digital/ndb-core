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

  async validateCsvFile(file: File): Promise<ParseResult> {
    if (!file.name.endsWith(".csv")) {
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

  async importCsvContentToDB(
    csv: ParseResult,
    importMeta: ImportMetaData
  ): Promise<void> {
    // e.g. Child:abcd1234
    const recordIdPrefix =
      importMeta.entityType + ":" + importMeta.transactionId;

    // remove existing records, if any
    // there is a chance of collision
    const existingRecords = await this.db.getAll(recordIdPrefix);

    for (const record of existingRecords) {
      await this.db.remove(record);
    }

    let hasIdProperty = true;

    if (!csv.meta.fields.includes("_id")) {
      hasIdProperty = false;
      csv.meta.fields.push("_id");
    }

    for (const record of csv.data) {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null || propertyName === "_rev") {
          delete record[propertyName];
        }
      }

      // generate new _id as there is none
      if (!hasIdProperty) {
        const newUUID = uuid();
        record["_id"] = recordIdPrefix + newUUID.substring(8);
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
   * @param csvFile The file object of the csv data to be loaded
   * @param importMeta Additional information required for importing the file
   */
  async handleCsvImport(
    csvFile: ParseResult,
    importMeta: ImportMetaData
  ): Promise<void> {
    const restorePoint = await this.backupService.getJsonExport();
    const refTitle = $localize`Import new data?`;
    const refText = $localize`Are you sure you want to import this file?
      This will add or update ${csvFile.data.length} records from the loaded file.
      All existing records imported with the transaction id '${importMeta.transactionId}' will be deleted!`;

    const dialogRef = this.confirmationDialog.openDialog(refTitle, refText);

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      await this.importCsvContentToDB(csvFile, importMeta);

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
