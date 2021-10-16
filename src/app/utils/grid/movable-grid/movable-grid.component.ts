import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  ViewChildren,
} from "@angular/core";
import { CdkDragEnd, CdkDragMove, CdkDragStart } from "@angular/cdk/drag-drop";

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: "app-movable-grid",
  templateUrl: "./movable-grid.component.html",
  styleUrls: ["./movable-grid.component.scss"],
})
export class MovableGridComponent<GridItem> {
  @Input() model: GridItem[];
  @Output() modelChange = new EventEmitter<GridItem[]>();
  @Input() dragDisabled: boolean = true;

  @ViewChildren("gridItemContainer") containers: QueryList<ElementRef>;

  @Input() view: TemplateRef<any>;

  currentDragItemIndex?: number;
  get currentDraggedItem(): GridItem | undefined {
    if (
      this.currentDragItemIndex !== undefined &&
      this.currentDragItemIndex === -1
    ) {
      return this.model[this.currentDragItemIndex];
    } else {
      return undefined;
    }
  }

  dragMoved(event: CdkDragMove) {
    // TODO: preview the drag
  }

  distanceSquared(p1: Point, p2: Point): number {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
  }

  centerOf(rect: DOMRect): Point {
    return {
      x: Math.abs(rect.right + rect.left) / 2,
      y: Math.abs(rect.top + rect.bottom) / 2,
    };
  }

  dragStarted(event: CdkDragStart) {
    this.currentDragItemIndex = this.containers
      .map((el) => el.nativeElement)
      .indexOf(event.source.element.nativeElement);
  }

  dragEnded(event: CdkDragEnd) {
    const newIndex = this.bestIndex(
      event.source.element.nativeElement.getBoundingClientRect(),
      event.distance
    );
    if (newIndex !== this.currentDragItemIndex) {
      this.reorderElements(newIndex);
    }
    event.source.reset();
    this.currentDragItemIndex = undefined;
  }

  reorderElements(newIndex: number) {
    const item = this.model.splice(this.currentDragItemIndex, 1)[0];
    this.model.splice(newIndex, 0, item);
  }

  bestIndex(rect: DOMRect, distance: Point): number {
    let minDist = Number.POSITIVE_INFINITY;
    let newIndex = -1;
    this.containers.forEach((container, index) => {
      let dist: number;
      if (index === this.currentDragItemIndex) {
        dist = distance.x ** 2 + distance.y ** 2;
      } else {
        const staticRect: DOMRect = container.nativeElement.getBoundingClientRect();
        dist = this.distanceSquared(
          this.centerOf(rect),
          this.centerOf(staticRect)
        );
      }
      if (dist < minDist) {
        minDist = dist;
        newIndex = index;
      }
    });
    return newIndex;
  }
}
