import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ImportService } from "../import.service";
import { MatDialog } from "@angular/material/dialog";
import {
  ImportConfirmSummaryComponent,
  ImportDialogData,
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

@Component({
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

  readonly IMPORT_STATUS_COLUMN = "_importStatus";

  @Input() rawData: any[];

  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];
  @Input() additionalActions: AdditionalImportAction[];
  @Input() importExisting: ImportExistingSettings | undefined;
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() filename: string;

  entityConstructor: EntityConstructor;

  @Output() importComplete = new EventEmitter<ImportMetadata>();

  isLoading: boolean;
  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];
  MULTIPLE_MATCHING_ENTITIES_KEY =
    ImportExistingService.MULTIPLE_MATCHING_ENTITIES_KEY;

  ngOnChanges(changes: SimpleChanges) {
    this.entityConstructor = this.entityRegistry.get(this.entityType);

    // Every change requires a complete re-calculation
    this.parseRawData();
  }

  private async parseRawData() {
    if (!this.entityType || !this.columnMapping) {
      // incomplete settings, cannot proceed
      return;
    }

    this.isLoading = true;
    this.mappedEntities = (
      await this.importService.transformRawDataToEntities(this.rawData, {
        entityType: this.entityType,
        columnMapping: this.columnMapping,
        additionalActions: this.additionalActions,
        importExisting: this.importExisting,
        additionalSettings: this.additionalSettings,
      })
    ).sort((a, b) => {
      // sort _rev (existing records being updated) first, then new records
      if (a._rev === b._rev) return 0;
      if (!!a._rev) return -1;
      return 1;
    });

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
        .open(ImportConfirmSummaryComponent, {
          data: {
            entitiesToImport: this.mappedEntities,
            importSettings: {
              entityType: this.entityType,
              columnMapping: this.columnMapping,
              additionalActions: this.additionalActions,
              importExisting: this.importExisting,
              filename: this.filename,
            },
          } as ImportDialogData,
        })
        .afterClosed(),
    );

    if (!!confirmationResult) {
      this.importComplete.emit(confirmationResult);
    }
  }
}
