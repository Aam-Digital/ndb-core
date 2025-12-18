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
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  OnDestroy,
} from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ColumnConfig } from "app/core/common-components/entity-form/FormConfig";
import { AdminEntityService } from "../admin-entity.service";
import { Subscription } from "rxjs";

/**
 * Component for Admin UI to edit table columns or fields in other contexts like filters.
 */
@Component({
  selector: "app-admin-list-manager",
  imports: [
    CdkDropList,
    CdkDrag,
    EntityFieldsMenuComponent,
    EntityFieldLabelComponent,
    FontAwesomeModule,
    MatFormFieldModule,
    MatSelectModule
],
  templateUrl: "./admin-list-manager.component.html",
  styleUrl: "./admin-list-manager.component.scss",
})
export class AdminListManagerComponent implements OnInit, OnDestroy {
  private readonly adminEntityService = inject(AdminEntityService);
  private schemaUpdateSubscription: Subscription;
  @Input() items: ColumnConfig[] = [];
  @Input() entityType: EntityConstructor;
  @Input() fieldLabel: string;
  @Input() templateType: "default" | "filter" = "default";
  @Input() activeFields: ColumnConfig[] = [];

  /** custom fields that will be added in addition to schema fields for users to select from */
  @Input() additionalFields: ColumnConfig[] = [];

  /** emits changes to the selected fields as field config objects or IDs */
  @Output() itemsChange = new EventEmitter<ColumnConfig[]>();
  /** emits changes to the selected fields only as field IDs (custom field configs are mapped to their ID only) */
  @Output() idsChange = new EventEmitter<string[]>();

  availableItems: ColumnConfig[] = [];

  ngOnInit(): void {
    this.loadAvailableItems();

    // Subscribe to schema updates to refresh available items when fields are added/modified
    this.schemaUpdateSubscription =
      this.adminEntityService.entitySchemaUpdated.subscribe(() => {
        this.loadAvailableItems();
      });
  }

  ngOnDestroy(): void {
    this.schemaUpdateSubscription?.unsubscribe();
  }

  private loadAvailableItems(): void {
    if (!this.entityType) return;
    const targetEntitySchemaFields = Array.from(this.entityType.schema.keys());
    this.availableItems = Array.from(
      new Set([
        ...(this.activeFields ?? []),
        ...targetEntitySchemaFields,
        ...(this.additionalFields ?? []),
      ]),
    );
  }

  drop(event: CdkDragDrop<ColumnConfig[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.emitUpdatedConfig();
  }

  remove(item: ColumnConfig) {
    this.items = this.items.filter((i) => i !== item);
    this.emitUpdatedConfig();
  }

  updateItems(updatedItems: (string | ColumnConfig)[]) {
    this.items = updatedItems;
    this.emitUpdatedConfig();
  }

  /**
   * Emits the current items and their IDs to the parent component.
   * `itemsChange` provides the full `ColumnConfig` objects,
   * `idsChanges`, provides a simplified array of just the IDs
   */
  private emitUpdatedConfig() {
    this.itemsChange.emit(this.items);
    this.idsChange.emit(this.items.map(this.getFieldId));
  }

  getFieldId(field: ColumnConfig): string {
    return typeof field === "string" ? field : field.id;
  }

  get itemsAsStrings(): string[] {
    return this.items?.map(this.getFieldId);
  }
}
