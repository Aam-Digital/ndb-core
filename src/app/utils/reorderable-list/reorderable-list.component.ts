import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
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

@Component({
  selector: "app-reorderable-list",
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, EntityFieldsMenuComponent],
  templateUrl: "./reorderable-list.component.html",
  styleUrls: ["./reorderable-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ReorderableListComponent {
  @Input() items: any[] = [];
  @Input() availableItems: (string | ColumnConfig)[] = [];
  @Input() entityType: EntityConstructor;
  @Input() orientation: "vertical" | "horizontal" | "mixed" = "vertical";
  @Input() dropLockAxis: "x" | "y" | null = null;
  @Input() itemTemplate: TemplateRef<any>;
  @Input() fieldLabel: string;

  @Output() itemsChange = new EventEmitter<any[]>();

  drop(event: CdkDragDrop<(string | ColumnConfig)[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.itemsChange.emit([...this.items]);
  }

  remove(item: string | ColumnConfig) {
    this.items = this.items.filter((i) => i !== item);
    this.itemsChange.emit([...this.items]);
  }

  handleActiveFieldsChange(updatedItems: (string | ColumnConfig)[]) {
    this.items = [...updatedItems];
    this.itemsChange.emit(this.items);
  }
}
