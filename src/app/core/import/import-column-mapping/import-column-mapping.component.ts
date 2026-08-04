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
   * Show the config dialog of every column the user newly mapped, one dialog after the other,
   * so that the suggested value mappings are reviewed instead of silently skipped.
   *
   * Columns that were mapped automatically because their header matches a field are left alone,
   * opening their dialogs would bury the user in dialogs on entering the step. Those are marked
   * as unconfigured in the UI instead.
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
          // only columns the user mapped themselves, and only until their dialog was shown once
          // (selecting a field resets `configReview`, so a changed field is offered again)
          !col.manuallyUpdated ||
          col.configReview ||
          !this.configDialogs.hasConfigDialog(col, this.entityCtor())
        ) {
          continue;
        }

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
