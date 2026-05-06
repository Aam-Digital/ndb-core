import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../core/import/column-mapping";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { ImportAdditionalSettings } from "../../../core/import/import-additional-settings/import-additional-settings.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";

export interface LocationImportConfig {
  skipAddressLookup: boolean;
}

const LOOKUP_WARNING_THRESHOLD = 50;

/**
 * Inline import configuration component for location fields,
 * shown inside the column mapping UI to let users skip address lookup.
 */
@DynamicComponent("LocationImportConfig")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-location-import-config",
  templateUrl: "./location-import-config.component.html",
  imports: [MatCheckboxModule, FormsModule, FaIconComponent, MatTooltip],
})
export class LocationImportConfigComponent {
  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

  skipLookup = computed(
    () =>
      (this.col()?.additional as LocationImportConfig)?.skipAddressLookup ??
      false,
    // this state updates after toggling by the parent updating the input
  );

  private readonly uniqueAddressCount = computed(
    () => new Set(this.rawData().map((row) => row[this.col()?.column])).size,
  );

  showLookupWarning = computed(
    () =>
      this.uniqueAddressCount() > LOOKUP_WARNING_THRESHOLD &&
      !this.skipLookup(),
  );

  onToggle(value: boolean) {
    const col = this.col();
    this.onColumnMappingChange()?.({
      ...col,
      additional: { skipAddressLookup: value } as LocationImportConfig,
    });
  }
}
