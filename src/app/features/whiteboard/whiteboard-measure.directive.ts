import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  inject,
  output,
} from "@angular/core";

/**
 * Report the rendered size of the host element whenever it changes,
 * so that lines can be drawn to the border of items of any content.
 *
 * Sizes are reported in CSS pixels of the element itself, i.e. unaffected by a `scale` transform of a parent.
 */
@Directive({
  selector: "[appWhiteboardMeasure]",
})
export class WhiteboardMeasureDirective {
  readonly sizeChange = output<{ width: number; height: number }>();

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  constructor() {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      const { offsetWidth, offsetHeight } = this.element.nativeElement;
      this.zone.run(() =>
        this.sizeChange.emit({ width: offsetWidth, height: offsetHeight }),
      );
    });
    observer.observe(this.element.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
