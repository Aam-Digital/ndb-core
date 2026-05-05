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
import { DiscreteImportConfigComponent } from "../discrete-import-config/discrete-import-config.component";
import { DiscreteColumnMappingAdditional } from "../discrete.datatype";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * Inline import configuration component for discrete fields (enum, boolean, etc.),
 * shown inside the column mapping UI to let users define value-to-value mappings.
 */
@DynamicComponent("DiscreteImportInline")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-discrete-import-inline",
  template: `
    <button
      class="margin-left-small config-button"
      mat-stroked-button
      (click)="openConfig()"
      i18n="import - column mapping - configure discrete value mapping button"
      [matBadge]="badge()"
      [matBadgeHidden]="!badge()"
      matBadgeColor="warn"
    >
      Configure value mapping
    </button>
  `,
  imports: [MatButtonModule, MatBadgeModule],
})
export class DiscreteImportInlineComponent {
  private dialog = inject(MatDialog);

  @Input() col: ColumnMapping;
  @Input() rawData: any[] = [];
  @Input() entityType: EntityConstructor;
  @Input() otherColumnMappings: ColumnMapping[] = [];
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() onColumnMappingChange: (col: ColumnMapping) => void;

  badge(): string | undefined {
    const additional = this.col?.additional as DiscreteColumnMappingAdditional;
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
    const uniqueValues = new Set<any>(
      this.rawData.map((row) => row[this.col.column]),
    );

    this.dialog
      .open<DiscreteImportConfigComponent, MappingDialogData>(
        DiscreteImportConfigComponent,
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
