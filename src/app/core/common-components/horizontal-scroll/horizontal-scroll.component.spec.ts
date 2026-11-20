import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HorizontalScrollComponent } from "./horizontal-scroll.component";

describe("HorizontalScrollComponent", () => {
  let fixture: ComponentFixture<HorizontalScrollComponent>;
  let content: HTMLElement;
  let scrollbar: HTMLElement;
  let spacer: HTMLElement;

  const originalResizeObserver = globalThis.ResizeObserver;
  let notifyResize: () => void;
  const disconnect = vi.fn();

  /** jsdom does no layout, so the sizes of the content are set by hand */
  function resizeContent(scrollWidth: number, clientWidth: number) {
    Object.defineProperty(content, "scrollWidth", {
      value: scrollWidth,
      configurable: true,
    });
    Object.defineProperty(content, "clientWidth", {
      value: clientWidth,
      configurable: true,
    });
    notifyResize();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    globalThis.ResizeObserver = class implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = () => callback([], this);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnect;
    };
    disconnect.mockClear();

    fixture = TestBed.createComponent(HorizontalScrollComponent);
    const element: HTMLElement = fixture.nativeElement;
    content = element.querySelector<HTMLElement>(".content");
    scrollbar = element.querySelector<HTMLElement>(".sticky-scrollbar");
    spacer = element.querySelector<HTMLElement>(".scrollbar-spacer");
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("shows the scrollbar only while the content is wider than the visible area", () => {
    resizeContent(1200, 600);
    expect(scrollbar.classList.contains("hidden")).toBe(false);
    expect(spacer.style.width).toBe("1200px");

    resizeContent(600, 600);
    expect(scrollbar.classList.contains("hidden")).toBe(true);
  });

  it("scrolls the content and the sticky scrollbar together", () => {
    scrollbar.scrollLeft = 150;
    scrollbar.dispatchEvent(new Event("scroll"));
    expect(content.scrollLeft).toBe(150);

    content.scrollLeft = 40;
    content.dispatchEvent(new Event("scroll"));
    expect(scrollbar.scrollLeft).toBe(40);
  });

  it("does not copy back the delayed scroll event of its own sync", () => {
    content.scrollLeft = 40;
    content.dispatchEvent(new Event("scroll"));

    // the user keeps scrolling the content before the scrollbar's event of the sync arrives
    content.scrollLeft = 60;
    scrollbar.dispatchEvent(new Event("scroll"));
    expect(content.scrollLeft).toBe(60);

    content.dispatchEvent(new Event("scroll"));
    expect(scrollbar.scrollLeft).toBe(60);
  });

  it("stops observing the size when destroyed", () => {
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
