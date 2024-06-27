import {
  Directive,
  AfterViewInit,
  Input,
  Host,
  Output,
  EventEmitter,
} from "@angular/core";
import {
  CdkDragDrop,
  CdkDragEnter,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { distinctUntilChanged } from "rxjs";

@Directive({
  selector: "[appDraggableGrid]",
  standalone: true,
})
export class DraggableGridDirective implements AfterViewInit {
  /**
   * An array of elements to be reordered by drag & drop
   */
  @Input() arrayElements: any[] = [];

  /**
   * Emits the array of reordered elements, whenever the user dropped an element.
   */
  @Output() arrayElementsChange = new EventEmitter<any[]>();

  private targetIndex: number;
  private source: CdkDropList = null;
  private sourceIndex: number;
  private dragRef: any = null;

  constructor(@Host() private hostElement: CdkDropListGroup<any>) {}

  ngAfterViewInit() {
    for (let dropList of this.hostElement._items as Set<CdkDropList>) {
      dropList.entered
        .asObservable()
        .pipe(
          distinctUntilChanged(
            (prev: CdkDragEnter, curr: CdkDragEnter) =>
              prev.container === curr.container,
          ),
        )
        .subscribe((event) => this.onDropListEntered(event));

      dropList.dropped.subscribe((event) => this.onDropListDropped(event));
    }
  }

  //@HostListener("cdkDropListDropped")
  onDropListDropped(event: CdkDragDrop<any>) {
    const placeholder = event.container;
    // placeholder === this.target === event.container
    // this.target === event.container
    // this.source === event.previousContainer
    // TODO: --> remove class variables above and only use event properties instead

    const placeholderElement: HTMLElement = placeholder.element.nativeElement;
    const placeholderParentElement: HTMLElement =
      placeholderElement.parentElement;

    // as we are moving around the actual element (rather than a different preview/placeholder div), hiding it and then readding seems to be counterproductive
    //placeholderElement.style.display = "none";

    console.log("onDropListDropped removing and appending placeholder ");
    placeholderParentElement.removeChild(placeholderElement);
    placeholderParentElement.appendChild(placeholderElement);
    placeholderParentElement.insertBefore(
      event.previousContainer.element.nativeElement,
      placeholderParentElement.children[this.sourceIndex],
    );

    if (placeholder._dropListRef.isDragging()) {
      placeholder._dropListRef.exit(this.dragRef);
    }

    this.source = null;
    this.dragRef = null;

    console.log(
      "SourceIndex:",
      this.sourceIndex,
      "TargetIndex:",
      this.targetIndex,
    );

    if (this.sourceIndex !== this.targetIndex) {
      // indices are +1 from the extra template div that is added
      console.log(
        "SourceIndex:",
        this.sourceIndex,
        "TargetIndex:",
        this.targetIndex,
      );

      moveItemInArray(
        this.arrayElements,
        this.sourceIndex - 1,
        this.targetIndex - 1,
      );
      this.arrayElementsChange.emit(this.arrayElements);
    }
  }

  //@HostListener("cdkDropListEntered", ["$event"])
  onDropListEntered(event: CdkDragEnter) {
    const { item, container } = event;
    const placeholder = event.container;

    //if (container === placeholder) { console.log("returning "); return; }

    console.log("cdkDropListEntered", event);

    const placeholderElement: HTMLElement = placeholder.element.nativeElement;
    const sourceElement: HTMLElement = item.dropContainer.element.nativeElement;
    const dropElement: HTMLElement = container.element.nativeElement;

    const dragIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      this.source ? placeholderElement : sourceElement,
    );
    const dropIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      dropElement,
    );

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = item.dropContainer;
      sourceElement.parentElement.removeChild(sourceElement);
    }
    this.targetIndex = dropIndex;
    this.dragRef = item._dragRef;
    placeholderElement.style.display = "";
    dropElement.parentElement.insertBefore(
      placeholderElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement,
    );
    placeholder._dropListRef.enter(
      item._dragRef,
      item.element.nativeElement.offsetLeft,
      item.element.nativeElement.offsetTop,
    );

    console.log("DragIndex:", dragIndex, "DropIndex:", dropIndex);
    console.log("Placeholder Element:", placeholderElement);
    console.log("Source Element:", sourceElement);
    console.log("Drop Element:", dropElement);
    console.log("Placeholder", placeholder.element.nativeElement.innerText);
  }
}
