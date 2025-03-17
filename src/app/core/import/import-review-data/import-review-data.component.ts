import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
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
import { ImportMetadata } from "../import-metadata";
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

@Component({
  selector: "app-import-review-data",
  templateUrl: "./import-review-data.component.html",
  styleUrls: ["./import-review-data.component.scss"],
  standalone: true,
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
  ],
})
export class ImportReviewDataComponent implements OnChanges {
  readonly IMPORT_STATUS_COLUMN = "_importStatus";

  @Input() rawData: any[];

  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];
  @Input() additionalActions: AdditionalImportAction[];
  @Input() matchExistingByFields: string[];

  entityConstructor: EntityConstructor;

  @Output() importComplete = new EventEmitter<ImportMetadata>();

  isLoading: boolean;
  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];

  constructor(
    private importService: ImportService,
    private matDialog: MatDialog,
    private entityRegistry: EntityRegistry,
  ) {}

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
        matchExistingByFields: this.matchExistingByFields,
      })
    )
      // sort _rev (existing records being updated) first, then new records
      .sort((a, b) => (a._rev === b._rev ? 0 : !!a._rev ? -1 : 1));

    this.displayColumns = [
      this.IMPORT_STATUS_COLUMN,
      ...this.columnMapping
        .filter(({ propertyName }) => !!propertyName)
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
              matchExistingByFields: this.matchExistingByFields,
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
