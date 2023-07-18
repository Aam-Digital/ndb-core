import { Component, ViewChild } from "@angular/core";
import { ParsedData } from "../../../core/input-file/input-file.component";
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";
import { ImportFileComponent } from "../import-file/import-file.component";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { ImportMetadata } from "../import-metadata";
import { AlertService } from "../../../core/alerts/alert.service";
import { ActivatedRoute } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { ImportHistoryComponent } from "../import-history/import-history.component";
import { EntityTypeLabelPipe } from "../../../core/entity-components/entity-type-label/entity-type-label.pipe";
import { ImportEntityTypeComponent } from "../import-entity-type/import-entity-type.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";
import { ImportAdditionalActionsComponent } from "../import-additional-actions/import-additional-actions.component";
import { MatButtonModule } from "@angular/material/button";
import { ImportColumnMappingComponent } from "../import-column-mapping/import-column-mapping.component";
import { ImportReviewDataComponent } from "../import-review-data/import-review-data.component";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
//TODO: @RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
  standalone: true,
  imports: [
    MatStepperModule,
    FontAwesomeModule,
    NgIf,
    ImportFileComponent,
    MatCardModule,
    ImportHistoryComponent,
    EntityTypeLabelPipe,
    ImportEntityTypeComponent,
    MatExpansionModule,
    HelpButtonComponent,
    ImportAdditionalActionsComponent,
    MatButtonModule,
    ImportColumnMappingComponent,
    ImportReviewDataComponent,
  ],
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
    // TODO EntitySubrecord shows saved entities for a moment (because it listens to the entity updates)
    // TODO some components can't handle the reset and throw errors (maybe reload page instead to destroy the state completely)
    this.reset(true);
  }
}
