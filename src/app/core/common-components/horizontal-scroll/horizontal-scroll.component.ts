import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";

/**
 * Lets wide content (e.g. a table) scroll sideways on its own,
 * with a horizontal scrollbar that sticks to the bottom of the screen
 * while any part of the content is visible.
 *
 * The page itself does not scroll sideways (see UiComponent),
 * so wrap any content that can be wider than the screen in this component.
 */
@Component({
  selector: "app-horizontal-scroll",
  template: `
    <div #content class="content" (scroll)="syncScroll(content, scrollbar)">
      <ng-content />
    </div>
    <div
      #scrollbar
      class="sticky-scrollbar"
      [class.hidden]="!overflows()"
      (scroll)="syncScroll(scrollbar, content)"
    >
      <div class="scrollbar-spacer" [style.width.px]="contentWidth()"></div>
    </div>
  `,
  styleUrl: "./horizontal-scroll.component.scss",
})
export class HorizontalScrollComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>("content");

  /** full width of the content, including the part scrolled out of view */
  protected readonly contentWidth = signal(0);
  private readonly visibleWidth = signal(0);
  protected readonly overflows = computed(
    () => this.contentWidth() > this.visibleWidth(),
  );

  constructor() {
    afterNextRender(() => {
      const content = this.content().nativeElement;
      const observer = new ResizeObserver(() => this.measure());
      // the content element only resizes with the screen, its children resize with their data (e.g. columns)
      observer.observe(content);
      for (const child of Array.from(content.children)) {
        observer.observe(child);
      }
      this.destroyRef.onDestroy(() => observer.disconnect());
      this.measure();
    });
  }

  private measure() {
    const content = this.content().nativeElement;
    this.contentWidth.set(content.scrollWidth);
    this.visibleWidth.set(content.clientWidth);
  }

  protected syncScroll(source: HTMLElement, target: HTMLElement) {
    if (target.scrollLeft !== source.scrollLeft) {
      target.scrollLeft = source.scrollLeft;
    }
  }
}
