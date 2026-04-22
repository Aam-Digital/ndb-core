import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ImportCellError, ImportService } from "../import.service";
import { MatDialog } from "@angular/material/dialog";
import {
  ImportConfirmSummaryComponent,
  ImportDialogData,
  ImportDialogResult,
} from "../import-confirm-summary/import-confirm-summary.component";
import { lastValueFrom } from "rxjs";
import { ImportExistingSettings, ImportMetadata } from "../import-metadata";
import { ImportAdditionalSettings } from "../import-additional-settings/import-additional-settings.component";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { MatProgressBar } from "@angular/material/progress-bar";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
} from "@angular/material/table";
import { AdditionalImportAction } from "../additional-actions/additional-import-action";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { HintBoxComponent } from "../../common-components/hint-box/hint-box.component";
import { ImportExistingService } from "../update-existing/import-existing.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { Logging } from "../../logging/logging.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-review-data",
  templateUrl: "./import-review-data.component.html",
  styleUrls: ["./import-review-data.component.scss"],
  imports: [
    MatButtonModule,
    HelpButtonComponent,
    EntitiesTableComponent,
    MatProgressBar,
    MatColumnDef,
    MatCell,
    MatCellDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatTooltip,
    EntityBlockComponent,
    HintBoxComponent,
    FaIconComponent,
  ],
})
export class ImportReviewDataComponent implements OnChanges {
  private importService = inject(ImportService);
  private matDialog = inject(MatDialog);
  private entityRegistry = inject(EntityRegistry);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  readonly IMPORT_STATUS_COLUMN = "_importStatus";

  @Input() rawData: any[];

  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];
  @Input() additionalActions: AdditionalImportAction[];
  @Input() importExisting: ImportExistingSettings | undefined;
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() filename: string;

  /**
   * Indicate if the component is currently visible,
   * so that re-calculation and popups only happen then.
   */
  @Input() stepIsFocused = true;

  entityConstructor: EntityConstructor;

  @Output() importComplete = new EventEmitter<ImportMetadata>();

  isLoading: boolean;
  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];
  transformationErrorColumns: string[] = [];
  MULTIPLE_MATCHING_ENTITIES_KEY =
    ImportExistingService.MULTIPLE_MATCHING_ENTITIES_KEY;

  private static readonly DATA_INPUT_KEYS = [
    "rawData",
    "entityType",
    "columnMapping",
    "additionalActions",
    "importExisting",
    "additionalSettings",
  ];

  private dataInputsChanged = false;

  ngOnChanges(changes: SimpleChanges) {
    this.entityConstructor = this.entityRegistry.get(this.entityType);

    const dataChanged = this.hasDataInputChanges(changes);
    if (dataChanged) {
      this.dataInputsChanged = true;
    }

    if (this.dataInputsChanged && this.stepIsFocused) {
      this.parseRawData();
      this.dataInputsChanged = false;
    }
  }

  private hasDataInputChanges(changes: SimpleChanges): boolean {
    return ImportReviewDataComponent.DATA_INPUT_KEYS.some(
      (key) => key in changes,
    );
  }

  private async parseRawData() {
    if (!this.entityType || !this.columnMapping) {
      // incomplete settings, cannot proceed
      return;
    }

    this.isLoading = true;
    try {
      const result = await this.importService.transformRawDataToEntities(
        this.rawData,
        {
          entityType: this.entityType,
          columnMapping: this.columnMapping,
          additionalActions: this.additionalActions,
          importExisting: this.importExisting,
          additionalSettings: this.additionalSettings,
        },
      );
      this.setTransformationErrors(result.errors);

      if (result.errors.length > 0 && this.stepIsFocused) {
        await this.showTransformationErrorDialog(result.errors);
      }

      this.mappedEntities = result.entities.sort((a, b) => {
        // sort _rev (existing records being updated) first, then new records
        if (a._rev === b._rev) return 0;
        if (!!a._rev) return -1;
        return 1;
      });
    } catch (e) {
      Logging.error("Failed to transform import data", e);
      this.mappedEntities = [];
      this.transformationErrorColumns = [];
    }

    this.displayColumns = [
      this.IMPORT_STATUS_COLUMN,
      ...this.columnMapping
        // remove unmapped columns:
        .filter(({ propertyName }) => !!propertyName)
        // show multi-mapped columns only once:
        .filter(
          (c) =>
            this.columnMapping.find(
              (x) => x.propertyName === c.propertyName,
            ) === c,
        )
        .map(({ propertyName }) => propertyName),
    ];

    this.isLoading = false;
  }

  async startImport() {
    const confirmationResult = await lastValueFrom(
      this.matDialog
        .open<
          ImportConfirmSummaryComponent,
          ImportDialogData,
          ImportDialogResult
        >(ImportConfirmSummaryComponent, {
          data: {
            entitiesToImport: this.mappedEntities,
            importSettings: {
              entityType: this.entityType,
              columnMapping: this.columnMapping,
              additionalActions: this.additionalActions,
              importExisting: this.importExisting,
              additionalSettings: this.additionalSettings,
              filename: this.filename,
            },
          } as ImportDialogData,
        })
        .afterClosed(),
    );

    if (confirmationResult?.errorOccured) {
      // Problem during import - maybe underlying data changed. Refresh and let user retry
      await this.parseRawData();
      return;
    }

    if (confirmationResult?.completedImport) {
      this.importComplete.emit(confirmationResult.completedImport);
    }
  }

  private showTransformationErrorDialog(
    errors: ImportCellError[],
  ): Promise<boolean | string | undefined> {
    Logging.warn("Import Cell Errors", JSON.stringify(errors));

    return this.confirmationDialog.getConfirmation(
      $localize`Problems while preparing data for import`,
      $localize`${errors.length} value(s) could not be transformed and were skipped.`,
      OkButton,
    );
  }

  private setTransformationErrors(errors: ImportCellError[]): void {
    const uniqueColumns = [...new Set(errors.map((e) => e.column))];
    this.transformationErrorColumns = uniqueColumns;
  }
}
