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
import { Entity } from "../../core/entity/model/entity";

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
    const entity = {}
    for (const col in row) {
      const property = importMeta.columnMap[col];
      if (property) {
        if (property === "_id") {
          entity[property] = Entity.createPrefixedId(
            importMeta.entityType,
            row[col]
          );
        } else {
          entity[property] = row[col];
        }
      }
    }
    return entity;
  }

  private createSearchIndices(importMeta: ImportMetaData, entity) {
    const ctor = this.dynamicEntityService.getEntityConstructor(
      importMeta.entityType
    );
    entity["searchIndices"] = Object.assign(new ctor(), entity).searchIndices;
  }
}
