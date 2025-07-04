import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { ColumnConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityFieldsMenuComponent } from "#src/app/core/common-components/entity-fields-menu/entity-fields-menu.component";
import { EntityFieldLabelComponent } from "#src/app/core/common-components/entity-field-label/entity-field-label.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

/**
 * Component for Admin UI to edit table columns or fields in other contexts like filters.
 */
@Component({
  selector: "app-admin-list-manager",
  imports: [
    CommonModule,
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
  @Input() items: (string | ColumnConfig)[] = [];
  @Input() availableItems: (string | ColumnConfig)[] = [];
  @Input() entityType: EntityConstructor;
  @Input() fieldLabel: string;
  @Input() templateType: "default" | "filter" = "default";

  @Output() itemsChange = new EventEmitter<string[]>();

  drop(event: CdkDragDrop<(string | ColumnConfig)[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.itemsChange.emit([...this.items] as string[]);
  }

  remove(item: string | ColumnConfig) {
    this.items = this.items.filter((i) => i !== item);
    this.itemsChange.emit([...this.items] as string[]);
  }

  updateItems(updatedItems: (string | ColumnConfig)[]) {
    this.items = [...updatedItems];
    this.itemsChange.emit(this.items as string[]);
  }

  getFieldId(field: string | ColumnConfig): string {
    return typeof field === "string" ? field : field.id;
  }

  get itemsAsStrings(): string[] {
    return this.items.map(this.getFieldId);
  }
}
