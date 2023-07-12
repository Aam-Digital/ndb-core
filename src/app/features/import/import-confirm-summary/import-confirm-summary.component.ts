import { Component, Inject } from "@angular/core";
import { ImportService } from "../import.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import { ImportSettings } from "../import-metadata";

/**
 * Data passed into Import Confirmation Dialog.
 */
export interface ImportDialogData {
  entitiesToImport: Entity[];
  importSettings: ImportSettings;
}

@Component({
  selector: "app-import-confirm-summary",
  templateUrl: "./import-confirm-summary.component.html",
  styleUrls: ["./import-confirm-summary.component.scss"],
})
export class ImportConfirmSummaryComponent {
  importInProgress: boolean;

  constructor(
    private dialogRef: MatDialogRef<ImportConfirmSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportDialogData,
    private importService: ImportService
  ) {}

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc.

  async executeImport() {
    this.importInProgress = true;
    this.dialogRef.disableClose = true;

    await this.importService.executeImport(
      this.data.entitiesToImport,
      this.data.importSettings
    );

    this.importInProgress = false;
    this.dialogRef.disableClose = false;
    this.dialogRef.close(true);
  }
}
