import {
  Component,
  inject,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
  effect,
  untracked,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { ImportColumnMappingService } from "./import-column-mapping.service";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping/edit-import-column-mapping.component";
import { ImportAdditionalSettings } from "../import-additional-settings";
import { ImportConfigDialogService } from "./import-config-dialog.service";

/**
 * Import sub-step: Let user map columns from import data to entity properties
 * and define value matching and transformations.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-import-column-mapping",
  templateUrl: "./import-column-mapping.component.html",
  styleUrls: ["./import-column-mapping.component.scss"],
  imports: [
    EditImportColumnMappingComponent,
    HelpButtonComponent,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatBadgeModule,
  ],
})
export class ImportColumnMappingComponent {
  private readonly entities = inject(EntityRegistry);
  private readonly importColumnMappingService = inject(
    ImportColumnMappingService,
  );
  private readonly configDialogs = inject(ImportConfigDialogService);

  rawData = input<any[]>([]);
  columnMapping = model<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  entityType = input<string>();

  entityCtor = computed(() =>
    this.entityType() ? this.entities.get(this.entityType()) : undefined,
  );

  /** for each column, the field whose config dialog was already shown to the user */
  private readonly reviewedFields = new Map<string, string>();
  private reviewingConfigs = false;

  constructor() {
    effect(() => {
      const cm = this.columnMapping();
      const ctor = this.entityCtor();
      if (!ctor) return;
      const autoMappings =
        this.importColumnMappingService.automaticallySelectMappings(
          JSON.parse(JSON.stringify(cm)),
          ctor.schema,
        );
      if (JSON.stringify(autoMappings) !== JSON.stringify(cm)) {
        untracked(() => this.columnMapping.set(autoMappings));
      }
      untracked(() => this.reviewConfigsOfMappedColumns());
    });
  }

  /**
   * Show the config dialog of every mapped column that requires one, one dialog after the other.
   *
   * Without this the suggested value mappings are never applied for columns the user did not
   * touch (e.g. mapped automatically because the column header matches a field),
   * and the raw values from the file are imported as they are.
   */
  private async reviewConfigsOfMappedColumns() {
    if (this.reviewingConfigs) {
      return;
    }
    this.reviewingConfigs = true;

    try {
      for (const column of this.columnMapping().map((c) => c.column)) {
        const col = this.columnMapping().find((c) => c.column === column);
        if (
          !col?.propertyName ||
          this.reviewedFields.get(column) === col.propertyName ||
          !this.configDialogs.hasConfigDialog(col, this.entityCtor())
        ) {
          continue;
        }

        this.reviewedFields.set(column, col.propertyName);
        const configuredCol = await this.configDialogs.openConfigDialog(
          col,
          this.rawData(),
          this.entityCtor(),
          this.additionalSettings(),
        );
        this.updateColumnMapping(col, configuredCol);
      }
    } finally {
      this.reviewingConfigs = false;
    }
  }

  updateColumnMapping(
    originalColumnMapping: ColumnMapping,
    newColumnMapping: ColumnMapping,
  ) {
    this.columnMapping.update((cm) => {
      const next = [...cm];
      // match by column rather than object identity, changes can be emitted after the array was replaced
      const index = next.findIndex(
        (c) => c.column === originalColumnMapping.column,
      );
      if (index >= 0) {
        next[index] = { ...newColumnMapping };
      }
      return next;
    });
  }
}
