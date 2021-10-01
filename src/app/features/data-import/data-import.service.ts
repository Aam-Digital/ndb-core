import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { Papa } from "ngx-papaparse";
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

  async importCsvContentToDB(csv: string): Promise<void> {
    const parsedCsv = this.papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

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
  async handleCsvImport(file: Blob) {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await readFile(file);

    const dialogRef = this.confirmationDialog.openDialog(
      $localize`Import new data?`,
      $localize`Are you sure you want to import this file? This will add or update ${
        newData.trim().split("\n").length - 1
      } records from the loaded file. Existing records with same "_id" in the database will be overwritten!`
    );

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
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
