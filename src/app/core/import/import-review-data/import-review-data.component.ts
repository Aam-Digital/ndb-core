import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { Entity } from "../../entity/model/entity";
import { ImportService } from "../import.service";
import { MatDialog } from "@angular/material/dialog";
import {
  ImportConfirmSummaryComponent,
  ImportDialogData,
} from "../import-confirm-summary/import-confirm-summary.component";
import { lastValueFrom } from "rxjs";
import { ImportMetadata } from "../import-metadata";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { EntitySubrecordComponent } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { NgIf } from "@angular/common";

@Component({
  selector: "app-import-review-data",
  templateUrl: "./import-review-data.component.html",
  styleUrls: ["./import-review-data.component.scss"],
  standalone: true,
  imports: [
    MatButtonModule,
    HelpButtonComponent,
    EntitySubrecordComponent,
    NgIf,
  ],
})
export class ImportReviewDataComponent implements OnChanges {
  @Input() rawData: any[];
  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];
  @Input() additionalActions: AdditionalImportAction[];

  @Output() importComplete = new EventEmitter<ImportMetadata>();

  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];

  constructor(
    private importService: ImportService,
    private matDialog: MatDialog,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // Every change requires a complete re-calculation
    this.parseRawData();
  }

  private async parseRawData() {
    this.mappedEntities = await this.importService.transformRawDataToEntities(
      this.rawData,
      this.entityType,
      this.columnMapping,
    );

    this.displayColumns = this.columnMapping
      .filter(({ propertyName }) => !!propertyName)
      .map(({ propertyName }) => propertyName);
  }

  async startImport() {
    const confirmationResult = await lastValueFrom(
      this.matDialog
        .open(ImportConfirmSummaryComponent, {
          data: {
            entitiesToImport: this.mappedEntities,
            importSettings: {
              columnMapping: this.columnMapping,
              entityType: this.entityType,
              additionalActions: this.additionalActions,
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
