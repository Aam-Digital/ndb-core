import { CdkDropListGroup, CdkDropList, CdkDrag } from "@angular/cdk/drag-drop";
import { Component, Input } from "@angular/core";
import { DraggableGridDirective } from "./draggable-grid.directive";
import { MatChip } from "@angular/material/chips";
import { NgFor } from "@angular/common";

@Component({
  selector: "app-draggable-grid-sample",
  standalone: true,
  template: `Drag & Drop items in grid:
    <div
      cdkDropListGroup
      appDraggableGrid
      [arrayElements]="items"
      (arrayElementsChange)="onChange($event)"
      class="flex-row flex-wrap gap-regular"
    >
      <div cdkDropList></div>
      <!-- @for (item of items; track item) { -->
      <div cdkDropList *ngFor="let item of items">
        <mat-chip cdkDrag>
          {{ item }}
        </mat-chip>
      </div>
    </div>`,
  imports: [
    MatChip,
    NgFor,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    DraggableGridDirective,
  ],
})
export class DraggableGridSampleComponent {
  @Input() items: string[];

  onChange(items: string[]): void {
    items = JSON.parse(JSON.stringify(items));
  }
}
