import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings";
import { ImportConfigDialogService } from "../../../import/import-column-mapping/import-config-dialog.service";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
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
  imports: [MatButtonModule, MatBadgeModule, MatTooltipModule],
})
export class DateImportConfigComponent {
  private readonly configDialogs = inject(ImportConfigDialogService);

  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

  /**
   * Marks the column as not configured, same indicator as for value mappings.
   * An empty format is a configured state: it reads the dates the system understands on its own.
   */
  readonly badge = computed(() =>
    this.col()?.additional == null ? "?" : undefined,
  );

  readonly tooltip = computed(() => {
    const format = this.col()?.additional;
    if (format == null) {
      return $localize`:import date format tooltip - not configured:No date format is defined for this column. Dates that the system cannot read on its own are skipped during import.`;
    }
    if (format === "") {
      return $localize`:import date format tooltip - no format needed:The dates of this column are read without a format. Open to define one if they are not imported correctly.`;
    }
    return $localize`:import date format tooltip - configured:Dates of this column are read with the format "${format}:format:". Open to review or change it.`;
  });

  async openConfig() {
    const updated = await this.configDialogs.openConfigDialog(
      this.col(),
      this.rawData(),
      this.entityType(),
      this.additionalSettings(),
    );
    this.onColumnMappingChange()?.(updated);
  }
}
