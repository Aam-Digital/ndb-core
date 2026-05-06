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
@DynamicComponent("LocationImportInline")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-location-import-inline",
  template: `
    @if (showLookupWarning()) {
      <fa-icon
        icon="triangle-exclamation"
        class="lookup-warning-icon"
        matTooltip="Large import: address lookups may be slow or fail. Consider skipping lookups below."
        i18n-matTooltip
      ></fa-icon>
    }
    <mat-checkbox
      [ngModel]="skipLookup()"
      (ngModelChange)="onToggle($event)"
      i18n="import - location - skip address lookup checkbox"
    >
      Skip address lookup
    </mat-checkbox>
  `,
  imports: [MatCheckboxModule, FormsModule, FaIconComponent, MatTooltip],
})
export class LocationImportInlineComponent implements OnChanges {
  @Input() col: ColumnMapping;
  @Input() rawData: any[] = [];
  @Input() entityType: EntityConstructor;
  @Input() otherColumnMappings: ColumnMapping[] = [];
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() onColumnMappingChange: (col: ColumnMapping) => void;

  skipLookup = signal(false);

  private uniqueAddressCount = signal(0);

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
