import {
  Component,
  computed,
  inject,
  model,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";

import { AdminListManagerComponent } from "../../../../core/admin/admin-list-manager/admin-list-manager.component";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MatchingSideConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { ConditionsEditorComponent } from "app/core/common-components/conditions-editor/conditions-editor.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-matching-entity-side",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    AdminListManagerComponent,
    EntityTypeSelectComponent,
    ConditionsEditorComponent,
  ],
  templateUrl: "./edit-matching-entity-side.component.html",
  styleUrls: ["./edit-matching-entity-side.component.scss"],
})
export class EditMatchingEntitySideComponent {
  readonly entityRegistry = inject(EntityRegistry);

  sideConfig = model<MatchingSideConfig>({});

  readonly availableEntityTypes: string[] = this.entityRegistry
    .getEntityTypes()
    .map((ctor) => ctor.value.ENTITY_TYPE);

  readonly additionalFields = computed<ColumnConfig[]>(() => [
    { id: "distance", label: "Distance" },
    {
      id: "_id",
      label: $localize`:label for field represented as DisplayEntity block to select in Admin UI:Name (record preview)`,
      additional: this.sideConfig().entityType,
      noSorting: true,
      viewComponent: "DisplayEntity",
    },
  ]);

  readonly entityConstructor = computed<EntityConstructor | null>(() =>
    this.entityRegistry.get(this.sideConfig()?.entityType),
  );

  readonly columns = computed<ColumnConfig[]>(
    () => this.sideConfig()?.columns ?? [],
  );

  readonly filters = computed<string[]>(
    () => this.sideConfig()?.availableFilters?.map((f) => f.id) ?? [],
  );

  onEntityTypeChange(entityType: string | string[]): void {
    entityType = <string>entityType; // assert this is a string because we don't use multi-select mode
    if (this.sideConfig().entityType === entityType) return;

    this.sideConfig.set({
      entityType,
      columns: [],
      availableFilters: [],
      prefilter: {},
    });
  }

  onColumnsChange(newCols: ColumnConfig[]) {
    this.sideConfig.set({
      ...this.sideConfig(),
      columns: newCols,
    });
  }

  onFiltersChange(newFilters: ColumnConfig[]) {
    const updatedFilters = newFilters.map((f) =>
      typeof f === "string" ? f : f.id,
    );
    this.sideConfig.set({
      ...this.sideConfig(),
      availableFilters: updatedFilters.map((id) => ({ id })),
    });
  }

  onPrefilterChange(updatedPrefilter: any) {
    this.sideConfig.set({
      ...this.sideConfig(),
      prefilter: updatedPrefilter ?? {},
    });
  }
}
