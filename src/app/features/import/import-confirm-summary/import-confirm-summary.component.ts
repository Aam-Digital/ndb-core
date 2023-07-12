import { Component, Inject } from "@angular/core";
import { ImportService } from "../import.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import { ColumnMapping } from "../column-mapping";

export interface ImportData {
  entitiesToImport: Entity[];
  columnMapping: ColumnMapping[];
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
    @Inject(MAT_DIALOG_DATA) public data: ImportData,
    private importService: ImportService
  ) {}

  // TODO: detailed summary including warnings of unmapped columns, ignored values, etc.

  async executeImport() {
    this.importInProgress = true;
    this.dialogRef.disableClose = true;

    await this.importService.executeImport(this.data.entitiesToImport);

    this.importInProgress = false;
    this.dialogRef.disableClose = false;
    this.dialogRef.close(true);
  }
}
