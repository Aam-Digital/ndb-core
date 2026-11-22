import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from "@angular/core";
import { CdkScrollable } from "@angular/cdk/scrolling";

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
  imports: [CdkScrollable],
  template: `
    <div #content cdkScrollable class="content">
      <ng-content />
    </div>
    <div #scrollbar class="sticky-scrollbar" [class.hidden]="!overflows()">
      <div class="scrollbar-spacer" [style.width.px]="contentWidth()"></div>
    </div>
  `,
  styleUrl: "./horizontal-scroll.component.scss",
})
export class HorizontalScrollComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>("content");
  private readonly scrollbar =
    viewChild.required<ElementRef<HTMLElement>>("scrollbar");

  /** full width of the content, including the part scrolled out of view */
  protected readonly contentWidth = signal(0);
  private readonly visibleWidth = signal(0);
  protected readonly overflows = computed(
    () => this.contentWidth() > this.visibleWidth(),
  );

  /** position that syncScroll last wrote to an element */
  private readonly syncedPositions = new WeakMap<HTMLElement, number>();

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

      this.listenToScrolling(content, this.scrollbar().nativeElement);
    });
  }

  /**
   * Outside of Angular: a scroll event fires every frame while scrolling,
   * and syncing the scroll position needs no change detection.
   */
  private listenToScrolling(content: HTMLElement, scrollbar: HTMLElement) {
    const onContentScroll = () => this.syncScroll(content, scrollbar);
    const onScrollbarScroll = () => this.syncScroll(scrollbar, content);

    this.ngZone.runOutsideAngular(() => {
      content.addEventListener("scroll", onContentScroll, { passive: true });
      scrollbar.addEventListener("scroll", onScrollbarScroll, {
        passive: true,
      });
    });
    this.destroyRef.onDestroy(() => {
      content.removeEventListener("scroll", onContentScroll);
      scrollbar.removeEventListener("scroll", onScrollbarScroll);
    });
  }

  private measure() {
    const content = this.content().nativeElement;
    this.contentWidth.set(content.scrollWidth);
    this.visibleWidth.set(content.clientWidth);
  }

  private syncScroll(source: HTMLElement, target: HTMLElement) {
    // the browser fires the scroll event of a synced element a frame later:
    // copying that back would undo what the user scrolled in the meantime (e.g. trackpad momentum)
    const isEchoOfSync = this.syncedPositions.get(source) === source.scrollLeft;
    this.syncedPositions.delete(source);
    if (isEchoOfSync || target.scrollLeft === source.scrollLeft) {
      return;
    }

    target.scrollLeft = source.scrollLeft;
    this.syncedPositions.set(target, target.scrollLeft);
  }
}
