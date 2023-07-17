import { Component, ViewChild } from "@angular/core";
import { ParsedData } from "../../../core/input-file/input-file.component";
import { MatStepper } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";
import { ImportFileComponent } from "../import-file/import-file.component";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { ImportMetadata } from "../import-metadata";
import { AlertService } from "../../../core/alerts/alert.service";
import { ActivatedRoute } from "@angular/router";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
//TODO: @RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
})
export class ImportComponent {
  rawData: any[];
  entityType: string;
  additionalImportActions: AdditionalImportAction[];
  columnMapping: ColumnMapping[];

  @ViewChild(MatStepper) stepper: MatStepper;
  @ViewChild(ImportFileComponent) importFileComponent: ImportFileComponent;

  /** calculated for validation on columnMapping changes */
  mappedColumnsCount: number;

  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private alertService: AlertService,
    private route: ActivatedRoute
  ) {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has("entityType")) {
        this.entityType = params.get("entityType");
      }
    });
  }

  async reset(skipConfirmation?: boolean) {
    if (
      !skipConfirmation &&
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
    delete this.additionalImportActions;
    this.importFileComponent.reset();
    this.stepper.reset();
  }

  onDataLoaded(data: ParsedData<any>) {
    this.rawData = data.data;

    if (this.columnMapping) {
      this.alertService.addInfo(
        $localize`:alert info after file load:Column Mappings have been reset`
      );
    }
    this.onColumnMappingUpdate(
      data.fields.map((field) => ({ column: field, propertyName: undefined }))
    );
  }

  onColumnMappingUpdate(newColumnMapping: ColumnMapping[]) {
    this.columnMapping = newColumnMapping;
    this.mappedColumnsCount = newColumnMapping.filter(
      (m) => !!m.propertyName
    ).length;
  }

  applyPreviousMapping(importMetadata: ImportMetadata) {
    this.entityType = importMetadata.config.entityType;

    // apply columns individually to ensure only valid mappings are merging on top of existing mapping
    const applicableMapping: ColumnMapping[] = [];
    for (const existingCol of this.columnMapping) {
      let applicableCol = importMetadata.config.columnMapping.find(
        (c) => existingCol.column === c.column
      );
      if (!applicableCol) {
        // reset any existing mapping - the loading should also apply which columns are ignored
        applicableCol = { column: existingCol.column, propertyName: undefined };
      }
      applicableMapping.push(Object.assign({}, existingCol, applicableCol));
    }

    this.onColumnMappingUpdate(applicableMapping);
  }

  onImportCompleted(completedImport: ImportMetadata) {
    this.reset(true);
  }
}
