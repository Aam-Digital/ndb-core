import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ImportService } from "../import.service";
import { MatDialog } from "@angular/material/dialog";
import {
  ImportConfirmSummaryComponent,
  ImportDialogData,
} from "../import-confirm-summary/import-confirm-summary.component";
import { lastValueFrom } from "rxjs";
import { ImportMetadata, ImportSettings } from "../import-metadata";
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
  ],
})
export class ImportReviewDataComponent implements OnChanges {
  readonly IMPORT_STATUS_COLUMN = "_importStatus";

  @Input() rawData: any[];

  @Input() importSettings: Partial<ImportSettings>;
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
    this.entityConstructor = this.entityRegistry.get(
      this.importSettings.entityType,
    );

    // Every change requires a complete re-calculation
    this.parseRawData();
  }

  private async parseRawData() {
    if (!this.importSettings.entityType || !this.importSettings.columnMapping) {
      // incomplete settings, cannot proceed
      return;
    }

    this.isLoading = true;
    this.mappedEntities = await this.importService.transformRawDataToEntities(
      this.rawData,
      this.importSettings as ImportSettings,
    );

    this.displayColumns = [
      this.IMPORT_STATUS_COLUMN,
      ...this.importSettings.columnMapping
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
            importSettings: this.importSettings,
          } as ImportDialogData,
        })
        .afterClosed(),
    );

    if (!!confirmationResult) {
      this.importComplete.emit(confirmationResult);
    }
  }
}
