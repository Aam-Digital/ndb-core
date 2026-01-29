import { Component, ViewChild, inject } from "@angular/core";
import { ParsedData } from "../../common-components/input-file/input-file.component";
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";
import { ImportFileComponent } from "../import-file/import-file.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { AlertService } from "../../alerts/alert.service";
import { ActivatedRoute, Router } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatCardModule } from "@angular/material/card";
import { ImportHistoryComponent } from "../import-history/import-history.component";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { ImportEntityTypeComponent } from "../import-entity-type/import-entity-type.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { ImportAdditionalActionsComponent } from "../additional-actions/import-additional/import-additional-actions.component";
import { MatButtonModule } from "@angular/material/button";
import { ImportColumnMappingComponent } from "../import-column-mapping/import-column-mapping.component";
import { ImportReviewDataComponent } from "../import-review-data/import-review-data.component";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { RouteTarget } from "../../../route-target";
import { ImportMatchExistingComponent } from "../update-existing/import-match-existing/import-match-existing.component";
import { ImportAdditionalSettingsComponent } from "../import-additional-settings/import-additional-settings.component";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
@RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
  imports: [
    MatStepperModule,
    FontAwesomeModule,
    ImportFileComponent,
    MatCardModule,
    ImportHistoryComponent,
    EntityTypeLabelPipe,
    ImportEntityTypeComponent,
    MatExpansionModule,
    ImportAdditionalSettingsComponent,
    ImportAdditionalActionsComponent,
    ImportMatchExistingComponent,
    MatButtonModule,
    ImportColumnMappingComponent,
    ImportReviewDataComponent,
  ],
})
export class ImportComponent {
  private confirmationDialog = inject(ConfirmationDialogService);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject<Location>(LOCATION_TOKEN);

  rawData: any[];

  importSettings: Partial<ImportSettings> = {};

  @ViewChild(MatStepper) stepper: MatStepper;
  @ViewChild(ImportFileComponent) importFileComponent: ImportFileComponent;

  /** calculated for validation on columnMapping changes */
  mappedColumnsCount: number;

  /**
   * Get the list of field IDs that are set as prefilled in additional actions.
   * These fields should be disabled in the column mapping dropdown.
   */
  get prefilledFieldIds(): string[] {
    return (this.importSettings.additionalActions ?? []).reduce(
      (acc: string[], action) => {
        if (action.mode === "prefill") {
          acc.push(action.fieldId);
        }
        return acc;
      },
      [],
    );
  }

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has("entityType")) {
        this.importSettings.entityType = params.get("entityType");
      }
      if (params.has("additionalAction")) {
        const action = JSON.parse(params.get("additionalAction"));
        this.importSettings.additionalActions = [action];
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
    this.importSettings.filename = data.filename;

    if (this.importSettings.columnMapping) {
      this.alertService.addInfo(
        $localize`:alert info after file load:Column Mappings have been reset`,
      );
    }
    this.onColumnMappingUpdate(
      data.fields.map((field) => ({ column: field, propertyName: undefined })),
    );
  }

  onColumnMappingUpdate(newColumnMapping: ColumnMapping[]) {
    this.importSettings.columnMapping = newColumnMapping;
    // to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.mappedColumnsCount = newColumnMapping.filter(
        (m) => !!m.propertyName,
      ).length;
    });
  }

  applyPreviousMapping(importMetadata: ImportMetadata) {
    this.importSettings.entityType = importMetadata.config.entityType;
    this.importSettings.additionalActions =
      importMetadata.config.additionalActions;

    const adjustedMappings = this.importSettings.columnMapping.map(
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
