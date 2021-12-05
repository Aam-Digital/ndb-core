import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { Papa, ParseResult } from "ngx-papaparse";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BackupService } from "../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { readFile } from "../../utils/utils";

@Injectable()
@UntilDestroy()
export class DataImportService {
  constructor(
    private db: Database,
    private papa: Papa,
    private backupService: BackupService,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar
  ) {}

  async validateCsvFile(file: File, entityType: string): Promise<boolean> {
    const csvData = await readFile(file);
    const parsedCsvFile = this.parseCsvFile(csvData);

    // an empty csv file is not valid
    if (parsedCsvFile.data.length === 0) {
      // TODO: Either open a popup here which seems missplaced
      // Better: Have validation results, so any component can handle the result
      return false;
    }

    const record = parsedCsvFile.data[0];

    // check all properties, if there is an _id, make sure it fits
    for (const propertyName in record) {
      if (propertyName !== "_id") {
        continue;
      }

      if (!record[propertyName].startsWith(entityType)) {
        return false;
      }

      break;
    }

    return true;
  }

  parseCsvFile(csv: string): ParseResult {
    return this.papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
  }

  async importCsvContentToDB(csv: string): Promise<void> {
    const parsedCsv = this.parseCsvFile(csv);

    for (const record of parsedCsv.data) {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null || propertyName === "_rev") {
          delete record[propertyName];
        }
      }

      await this.db.put(record, true);
    }
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * @param file The file object of the csv data to be loaded
   */
  async handleCsvImport(file: Blob, transactionId: string): Promise<void> {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await readFile(file);

    const refTitle = $localize`Import new data?`;
    const refText = $localize`Are you sure you want to import this file? This will add or update ${
        newData.trim().split("\n").length - 1
      } records from the loaded file. All existing records imported with the transaction id '${transactionId}' will be deleted!`;

    const dialogRef = this.confirmationDialog.openDialog(
      refTitle,
      refText
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return Promise.resolve(undefined);
      }

      await this.importCsvContentToDB(newData);

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
