import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings/import-additional-settings.component";
import { MatDialog } from "@angular/material/dialog";
import { MappingDialogData } from "../../../import/import-column-mapping/mapping-dialog-data";
import { DateImportDialogComponent } from "./date-import-dialog.component";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * Inline import configuration component for date fields,
 * shown inside the column mapping UI to let users define a date format string.
 */
@DynamicComponent("DateImportConfig")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-import-config",
  templateUrl: "./date-import-config.component.html",
  imports: [MatButtonModule],
})
export class DateImportConfigComponent {
  private readonly dialog = inject(MatDialog);

  @Input() col: ColumnMapping;
  @Input() rawData: any[] = [];
  @Input() entityType: EntityConstructor;
  @Input() otherColumnMappings: ColumnMapping[] = [];
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() onColumnMappingChange: (col: ColumnMapping) => void;

  openConfig() {
    const uniqueValues = new Set<any>(
      this.rawData.map((row) => row[this.col.column]),
    );

    this.dialog
      .open<DateImportDialogComponent, MappingDialogData>(
        DateImportDialogComponent,
        {
          data: {
            col: this.col,
            values: [...uniqueValues],
            totalRowCount: this.rawData.length,
            entityType: this.entityType,
            additionalSettings: this.additionalSettings,
          },
          width: "80vw",
          disableClose: true,
        },
      )
      .afterClosed()
      .subscribe(() => this.onColumnMappingChange?.(this.col));
  }
}
