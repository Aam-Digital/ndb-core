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
import { ImportAdditionalSettings } from "../import-additional-settings/import-additional-settings.component";

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
  private entities = inject(EntityRegistry);
  private importColumnMappingService = inject(ImportColumnMappingService);

  rawData = input<any[]>([]);
  columnMapping = model<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  entityType = input<string>();

  entityCtor = computed(() =>
    this.entityType() ? this.entities.get(this.entityType()) : undefined,
  );

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
    });
  }

  updateColumnMapping(
    originalColumnMapping: ColumnMapping,
    newColumnMapping: ColumnMapping,
  ) {
    this.columnMapping.update((cm) => {
      const next = [...cm];
      const index = next.indexOf(originalColumnMapping);
      if (index >= 0) {
        next[index] = { ...newColumnMapping };
      }
      return next;
    });
  }
}
