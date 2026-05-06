import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  signal,
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
export class LocationImportConfigComponent implements OnChanges {
  @Input() col: ColumnMapping;
  @Input() rawData: any[] = [];
  @Input() entityType: EntityConstructor;
  @Input() otherColumnMappings: ColumnMapping[] = [];
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() onColumnMappingChange: (col: ColumnMapping) => void;

  skipLookup = signal(false);

  private readonly uniqueAddressCount = signal(0);

  showLookupWarning = computed(
    () =>
      this.uniqueAddressCount() > LOOKUP_WARNING_THRESHOLD &&
      !this.skipLookup(),
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["col"] || changes["rawData"]) {
      const additional = this.col?.additional as LocationImportConfig;
      this.skipLookup.set(additional?.skipAddressLookup ?? false);

      const count = new Set(this.rawData.map((row) => row[this.col?.column]))
        .size;
      this.uniqueAddressCount.set(count);
    }
  }

  onToggle(value: boolean) {
    this.skipLookup.set(value);
    this.col.additional = { skipAddressLookup: value } as LocationImportConfig;
    this.onColumnMappingChange?.(this.col);
  }
}
