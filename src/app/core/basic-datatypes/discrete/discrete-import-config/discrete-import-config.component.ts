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
import { DiscreteColumnMappingAdditional } from "../discrete.datatype";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
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
  imports: [MatButtonModule, MatBadgeModule, MatTooltipModule],
})
export class DiscreteImportConfigComponent {
  private readonly configDialogs = inject(ImportConfigDialogService);

  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

  /** how many of the file's values have no mapping yet, undefined while nothing is configured */
  readonly unmappedCount = computed<number | undefined>(() => {
    const additional = this.col()
      ?.additional as DiscreteColumnMappingAdditional;
    const valueMappings = additional?.values;
    if (!valueMappings) {
      return undefined;
    }
    return Object.values(valueMappings).filter((v) => v == null).length;
  });

  readonly badge = computed(() => {
    const unmapped = this.unmappedCount();
    if (unmapped === undefined) {
      return "?";
    }
    return unmapped > 0 ? unmapped.toString() : undefined;
  });

  readonly tooltip = computed(() => {
    const unmapped = this.unmappedCount();
    if (unmapped === undefined) {
      return $localize`:import value mapping tooltip - not configured:The values of this column are not mapped yet. They are imported exactly as they are in the file, which can result in values the system does not recognise.`;
    }
    if (unmapped > 0) {
      return $localize`:import value mapping tooltip - unmapped values:${unmapped}:count: of the values in this column have no mapping and are skipped during import.`;
    }
    return $localize`:import value mapping tooltip - configured:All values of this column are mapped. Open to review or change the mapping.`;
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
