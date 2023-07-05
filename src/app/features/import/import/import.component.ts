import { Component, ViewChild } from "@angular/core";
import { RouteTarget } from "../../../app.routing";
import { ParsedData } from "../../data-import/input-file/input-file.component";
import { MatStepper } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";
import { ImportFileComponent } from "../import-file/import-file.component";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
@RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
})
export class ImportComponent {
  rawData: ParsedData<any>;
  entityType: string;
  additionalImportActions: AdditionalImportAction[];
  columnMapping: ColumnMapping[];

  @ViewChild(MatStepper) stepper: MatStepper;
  @ViewChild(ImportFileComponent) importFileComponent: ImportFileComponent;

  constructor(private confirmationDialog: ConfirmationDialogService) {}

  async reset() {
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Import Reset Confirmation title:Cancel Import?`,
        $localize`:Import Reset Confirmation text:Do you really want to discard the currently prepared import?`
      ))
    ) {
      return;
    }

    delete this.rawData;
    delete this.entityType;
    delete this.columnMapping;
    this.importFileComponent.reset();
    this.stepper.reset();
  }

  onDataLoaded(data: ParsedData<any>) {
    this.rawData = data;

    // trigger next step automatically after change detection ran and recognized the current step as [completed]
    setTimeout(() => this.stepper.next());
  }
}
