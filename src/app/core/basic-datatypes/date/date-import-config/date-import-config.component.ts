import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings";
import { ImportConfigDialogService } from "../../../import/import-column-mapping/import-config-dialog.service";
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
  private readonly configDialogs = inject(ImportConfigDialogService);

  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

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
