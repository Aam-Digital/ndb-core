import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings/import-additional-settings.component";
import { MatDialog } from "@angular/material/dialog";
import { MappingDialogData } from "../../../import/import-column-mapping/mapping-dialog-data";
import { DiscreteImportDialogComponent } from "./discrete-import-dialog.component";
import { DiscreteColumnMappingAdditional } from "../discrete.datatype";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * Inline import configuration component for discrete fields (enum, boolean, etc.),
 * shown inside the column mapping UI to let users define value-to-value mappings.
 */
@DynamicComponent("DiscreteImportConfig")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-discrete-import-config",
  templateUrl: "./discrete-import-config.component.html",
  imports: [MatButtonModule, MatBadgeModule],
})
export class DiscreteImportConfigComponent {
  private readonly dialog = inject(MatDialog);

  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

  badge(): string | undefined {
    const additional = this.col()
      ?.additional as DiscreteColumnMappingAdditional;
    const valueMappings = additional?.values;
    if (!valueMappings) {
      return "?";
    }
    const unmappedCount = Object.values(valueMappings).filter(
      (v) => v === undefined,
    ).length;
    return unmappedCount > 0 ? unmappedCount.toString() : undefined;
  }

  openConfig() {
    const col = this.col();
    const uniqueValues = new Set<any>(
      this.rawData().map((row) => row[col.column]),
    );

    this.dialog
      .open<DiscreteImportDialogComponent, MappingDialogData>(
        DiscreteImportDialogComponent,
        {
          data: {
            col: col,
            values: [...uniqueValues],
            totalRowCount: this.rawData().length,
            entityType: this.entityType(),
            additionalSettings: this.additionalSettings(),
          },
          width: "80vw",
          disableClose: true,
        },
      )
      .afterClosed()
      .subscribe(() => this.onColumnMappingChange()?.(col));
  }
}
