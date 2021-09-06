import { Component, OnInit } from '@angular/core';
import {untilDestroyed} from "@ngneat/until-destroy";

@Component({
  selector: 'app-data-import',
  templateUrl: './data-import.component.html',
  styleUrls: ['./data-import.component.scss']
})
export class DataImportComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * Add the data from the loaded file to the database, inserting and updating records.
   * @param file The file object of the csv data to be loaded
   */
  async loadCsv(file: Blob) {
    const restorePoint = await this.backupService.getJsonExport();
    const newData = await this.readFile(file);

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

      await this.backupService.importCsv(newData, true);

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
