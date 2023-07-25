import { Component, Inject, ViewChild } from "@angular/core";
import { ParsedData } from "../../../core/input-file/input-file.component";
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";
import { ImportFileComponent } from "../import-file/import-file.component";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { ImportMetadata } from "../import-metadata";
import { AlertService } from "../../../core/alerts/alert.service";
import { ActivatedRoute, Router } from "@angular/router";
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
import { RouteTarget } from "../../../app.routing";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
@RouteTarget("Import")
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
    private route: ActivatedRoute,
    private router: Router,
    @Inject(LOCATION_TOKEN) private location: Location,
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
        $localize`:Import Reset Confirmation text:Do you really want to discard the currently prepared import?`,
      ))
    ) {
      return;
    }
    const currentRoute = this.location.pathname;
    return this.router
      .navigate([""], { skipLocationChange: true })
      .then(() =>
        this.router.navigate([currentRoute], { skipLocationChange: true }),
      );
  }

  onDataLoaded(data: ParsedData) {
    this.rawData = data.data;

    if (this.columnMapping) {
      this.alertService.addInfo(
        $localize`:alert info after file load:Column Mappings have been reset`,
      );
    }
    this.onColumnMappingUpdate(
      data.fields.map((field) => ({ column: field, propertyName: undefined })),
    );
  }

  onColumnMappingUpdate(newColumnMapping: ColumnMapping[]) {
    this.columnMapping = newColumnMapping;
    this.mappedColumnsCount = newColumnMapping.filter(
      (m) => !!m.propertyName,
    ).length;
  }

  applyPreviousMapping(importMetadata: ImportMetadata) {
    this.entityType = importMetadata.config.entityType;
    this.additionalImportActions = importMetadata.config.additionalActions;

    const adjustedMappings = this.columnMapping.map(
      ({ column }) =>
        importMetadata.config.columnMapping.find(
          (c) => column === c.column,
        ) ?? { column },
    );

    // TODO: load additionalActions also

    this.onColumnMappingUpdate(adjustedMappings);
  }

  onImportCompleted() {
    return this.reset(true);
  }
}
