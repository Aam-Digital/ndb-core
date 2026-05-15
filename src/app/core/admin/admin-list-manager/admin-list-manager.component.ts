import { EntityFieldsMenuComponent } from "#src/app/core/common-components/entity-fields-menu/entity-fields-menu.component";
import { EntityFieldLabelComponent } from "#src/app/core/entity/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  output,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ColumnConfig } from "app/core/common-components/entity-form/FormConfig";
import { AdminEntityService } from "../admin-entity.service";

/**
 * Component for Admin UI to edit table columns or fields in other contexts like filters.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-list-manager",
  imports: [
    CdkDropList,
    CdkDrag,
    EntityFieldsMenuComponent,
    EntityFieldLabelComponent,
    FontAwesomeModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: "./admin-list-manager.component.html",
  styleUrl: "./admin-list-manager.component.scss",
})
export class AdminListManagerComponent {
  private readonly adminEntityService = inject(AdminEntityService);
  private schemaUpdated = toSignal(this.adminEntityService.entitySchemaUpdated);

  items = input<ColumnConfig[]>([]);
  entityType = input<EntityConstructor>();
  fieldLabel = input<string>(undefined);
  templateType = input<"default" | "filter">("default");
  activeFields = input<ColumnConfig[]>([]);

  /** custom fields that will be added in addition to schema fields for users to select from */
  additionalFields = input<ColumnConfig[]>([]);

  /** emits changes to the selected fields as field config objects or IDs */
  itemsChange = output<ColumnConfig[]>();
  /** emits changes to the selected fields only as field IDs (custom field configs are mapped to their ID only) */
  idsChange = output<string[]>();

  availableItems = computed(() => {
    this.schemaUpdated(); // track schema updates
    if (!this.entityType()) return [];
    const targetEntitySchemaFields = Array.from(
      this.entityType().schema.keys(),
    );
    return Array.from(
      new Set([
        ...(this.activeFields() ?? []),
        ...targetEntitySchemaFields,
        ...(this.additionalFields() ?? []),
      ]),
    );
  });

  drop(event: CdkDragDrop<ColumnConfig[]>) {
    const newItems = [...(this.items() ?? [])];
    moveItemInArray(newItems, event.previousIndex, event.currentIndex);
    this.itemsChange.emit(newItems);
    this.idsChange.emit(newItems.map(this.getFieldId));
  }

  remove(item: ColumnConfig) {
    const newItems = (this.items() ?? []).filter((i) => i !== item);
    this.itemsChange.emit(newItems);
    this.idsChange.emit(newItems.map(this.getFieldId));
  }

  updateItems(updatedItems: (string | ColumnConfig)[]) {
    this.itemsChange.emit(updatedItems as ColumnConfig[]);
    this.idsChange.emit((updatedItems as ColumnConfig[]).map(this.getFieldId));
  }

  /**
   * Emits the current items and their IDs to the parent component.
   * `itemsChange` provides the full `ColumnConfig` objects,
   * `idsChanges`, provides a simplified array of just the IDs
   */
  private emitUpdatedConfig() {
    const current = this.items() ?? [];
    this.itemsChange.emit(current);
    this.idsChange.emit(current.map(this.getFieldId));
  }

  getFieldId(field: ColumnConfig): string {
    return typeof field === "string" ? field : field.id;
  }

  get itemsAsStrings(): string[] {
    return (this.items() ?? []).map(this.getFieldId);
  }
}
