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

@Component({
  selector: "app-reorderable-list",
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag],
  templateUrl: "./reorderable-list.component.html",
  styleUrls: ["./reorderable-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ReorderableListComponent<T extends string | ColumnConfig> {
  @Input() items: T[] = [];
  @Input() orientation: "vertical" | "horizontal" | "mixed" = "vertical";
  @Input() dropLockAxis: "x" | "y" | null = null;
  @Input() itemTemplate: TemplateRef<any>;

  @Output() itemsChange = new EventEmitter<T[]>();

  drop(event: CdkDragDrop<T[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.itemsChange.emit(this.items);
  }

  remove(item: T) {
    this.items = this.items.filter((i) => i !== item);
    this.itemsChange.emit(this.items);
  }
}
