import { Directive, AfterViewInit, HostListener, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from "@angular/core";
import { CdkDragEnter, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { v4 as uuid } from "uuid";
@Directive({
  selector: "[appDraggableGrid]",
  standalone: true,
})
export class DraggableGridDirective implements AfterViewInit, OnChanges {
  @Input() config: any;
  @Input() placeholder: CdkDropList;
  

  private target: CdkDropList = null;
  private targetIndex: number;
  private source: CdkDropList = null;
  private sourceIndex: number;
  private dragRef: any = null;

  id;
  constructor(private cdr: ChangeDetectorRef) {
    this.id = uuid();
  }

  ngAfterViewInit() {
    this.checkPlaceholder();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.placeholder && changes.placeholder.currentValue) {
      this.checkPlaceholder();
    }
  }

  private checkPlaceholder() {
    if (!this.placeholder) {
      console.error("Placeholder is null ");
    } else {
      console.log("Placeholder is avilable", this.placeholder);
      this.cdr.detectChanges();
    }
  }

  @HostListener("cdkDropListDropped")
  onDropListDropped() {
    if (!this.target) {
      console.warn("No target set", this.id);
      return;
    }
    console.log("onDropListDropped", this.placeholder, this.id);

    const placeholderElement: HTMLElement = this.placeholder.element.nativeElement;
    const placeholderParentElement: HTMLElement = placeholderElement.parentElement;
    placeholderElement.style.display = "none";

    console.log("onDropListDropped removing and appending placeholder ");
    placeholderParentElement.removeChild(placeholderElement);
    placeholderParentElement.appendChild(placeholderElement);
    placeholderParentElement.insertBefore(
      this.source.element.nativeElement,
      placeholderParentElement.children[this.sourceIndex]
    );

    if (this.placeholder._dropListRef.isDragging()) {
      this.placeholder._dropListRef.exit(this.dragRef);
    }

    this.target = null;
    this.source = null;
    this.dragRef = null;

    console.log("Config before moveItemInArray:", this.config);
    console.log("SourceIndex:", this.sourceIndex, "TargetIndex:", this.targetIndex);

    if (this.sourceIndex !== this.targetIndex) {
      moveItemInArray(this.config, this.sourceIndex, this.targetIndex);
    }
    this.cdr.detectChanges();
  }

  @HostListener("cdkDropListEntered", ["$event"])
  onDropListEntered(event: CdkDragEnter) {
    const { item, container } = event;

    if (container === this.placeholder) {
      console.log("returning ");
      return;
    }

    console.log("cdkDropListEntered", event, this.id);

    const placeholderElement: HTMLElement = this.placeholder.element.nativeElement;
    const sourceElement: HTMLElement = item.dropContainer.element.nativeElement;
    const dropElement: HTMLElement = container.element.nativeElement;

    const dragIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      this.source ? placeholderElement : sourceElement
    );
    const dropIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      dropElement
    );

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = item.dropContainer;
      sourceElement.parentElement.removeChild(sourceElement);
    }
    this.targetIndex = dropIndex;
    this.target = container;
    this.dragRef = item._dragRef;
    placeholderElement.style.display = "";
    dropElement.parentElement.insertBefore(
      placeholderElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement
    );
    this.placeholder._dropListRef.enter(
      item._dragRef,
      item.element.nativeElement.offsetLeft,
      item.element.nativeElement.offsetTop
    );

    console.log("DragIndex:", dragIndex, "DropIndex:", dropIndex);
    console.log("Source:", this.source, "Target:", this.target);
    console.log("Placeholder Element:", placeholderElement);
    console.log("Source Element:", sourceElement);
    console.log("Drop Element:", dropElement);
    console.log("Placeholder", this.placeholder.element.nativeElement.innerHTML)

    this.cdr.detectChanges();
  }
}
