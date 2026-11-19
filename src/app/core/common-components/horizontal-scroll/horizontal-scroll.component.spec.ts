import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HorizontalScrollComponent } from "./horizontal-scroll.component";

describe("HorizontalScrollComponent", () => {
  let fixture: ComponentFixture<HorizontalScrollComponent>;
  let content: HTMLElement;
  let scrollbar: HTMLElement;

  /** jsdom does no layout, so the sizes of the content are set by hand */
  function setContentSize(scrollWidth: number, clientWidth: number) {
    Object.defineProperty(content, "scrollWidth", { value: scrollWidth });
    Object.defineProperty(content, "clientWidth", { value: clientWidth });
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizontalScrollComponent);
    const element: HTMLElement = fixture.nativeElement;
    content = element.querySelector(".content");
    scrollbar = element.querySelector(".sticky-scrollbar");
  });

  it.each([
    [1200, 600, true],
    [600, 600, false],
  ])(
    "shows the scrollbar only when the content (%s px) is wider than the visible area (%s px)",
    async (scrollWidth, clientWidth, visible) => {
      setContentSize(scrollWidth, clientWidth);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(scrollbar.classList.contains("hidden")).toBe(!visible);
      expect(
        (scrollbar.querySelector(".scrollbar-spacer") as HTMLElement).style
          .width,
      ).toBe(`${scrollWidth}px`);
    },
  );

  it("scrolls the content and the sticky scrollbar together", () => {
    fixture.detectChanges();

    scrollbar.scrollLeft = 150;
    scrollbar.dispatchEvent(new Event("scroll"));
    expect(content.scrollLeft).toBe(150);

    content.scrollLeft = 40;
    content.dispatchEvent(new Event("scroll"));
    expect(scrollbar.scrollLeft).toBe(40);
  });
});
