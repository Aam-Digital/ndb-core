import {
  AfterViewInit,
  Directive,
  HostListener,
  Input
} from "@angular/core";
import {
  CdkDragEnter,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
@Directive({
  selector: "[appDraggableGrid]",
  standalone: true,
})
export class DraggableGridDirective implements AfterViewInit {
  @Input() config: any;
  @Input() placeholder: CdkDropList;
  // @ViewChild(CdkDropList) placeholder: CdkDropList;
  private target: CdkDropList = null;
  private targetIndex: number;
  private source: CdkDropList = null;
  private sourceIndex: number;
  private dragRef: any = null;

  ngAfterViewInit() {
    if (!this.placeholder) {
      console.error("Placeholder is null in directive");
    } else {
      console.log("Placeholder is set in directive:", this.placeholder);
    }
  }
  @HostListener("cdkDropListDropped")
  onDropListDropped() {
    if (!this.target) {
      return;
    }
    console.log("onDropListDropped",this.placeholder)
    const placeholderElement: HTMLElement =
      this.placeholder.element.nativeElement;
    const placeholderParentElement: HTMLElement =
      placeholderElement.parentElement;
    placeholderElement.style.display = "none";
    console.log("onDropListDropped1")

    placeholderParentElement.removeChild(placeholderElement);
    placeholderParentElement.appendChild(placeholderElement);
    placeholderParentElement.insertBefore(
      this.source.element.nativeElement,
      placeholderParentElement.children[this.sourceIndex],
    );
    console.log("onDropListDropped12")


    if (this.placeholder._dropListRef.isDragging()) {
      this.placeholder._dropListRef.exit(this.dragRef);
    }
    console.log("onDropListDropped123")

    this.target = null;
    this.source = null;
    this.dragRef = null;
    console.log("this.config",this.config)
    console.log("this.sourceIndex",this.sourceIndex)
    console.log("this.targetIndex",this.targetIndex)

    if (this.sourceIndex !== this.targetIndex) {
      moveItemInArray(this.config, this.sourceIndex, this.targetIndex);
    }
  }

  @HostListener("cdkDropListEntered", ["$event"])
  onDropListEntered({ item, container }: CdkDragEnter) {
    if (container == this.placeholder) {
      return;
    }
    console.log("cdkDropListEntered")

    const placeholderElement: HTMLElement =
      this.placeholder.element.nativeElement;
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
    this.target = container;
    this.dragRef = item._dragRef;
    placeholderElement.style.display = "";
    dropElement.parentElement.insertBefore(
      placeholderElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement,
    );
    this.placeholder._dropListRef.enter(
      item._dragRef,
      item.element.nativeElement.offsetLeft,
      item.element.nativeElement.offsetTop,
    );
  }
}
