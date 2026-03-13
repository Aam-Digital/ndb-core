import { TemplateTooltipDirective } from "./template-tooltip.directive";
import {
  ComponentFixture,
  TestBed,
} from "@angular/core/testing";
import { Component } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("TemplateTooltipDirective", () => {
  let fixture: ComponentFixture<any>;

  function hoverOn(element: HTMLElement) {
    element.dispatchEvent(
      new MouseEvent("mouseenter", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function hoverOff(element: HTMLElement) {
    element.dispatchEvent(
      new MouseEvent("mouseleave", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [MockComponent, NoopAnimationsModule],
    }).createComponent(MockComponent);
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not show the tooltip initially", () => {
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).toBeNull();
  });

  it("should show the tooltip after a certain period of time", async () => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2.textContent?.trim()).toBe("Custom Tooltip");
  });

  it("should not show the tooltip when the user has stopped hovering before a threshold", async () => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    await vi.advanceTimersByTimeAsync(750);
    hoverOff(div);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).toBeNull();
  });

  it("should hide the tooltip when the user's mouse leaves the tooltip element", async () => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    let h2: HTMLElement = document.querySelector("h2");
    expect(h2).not.toBeNull();
    hoverOff(h2);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    h2 = document.querySelector("h2");
    expect(h2).toBeNull();
  });

  it("should not hide the tooltip when the user's mouse leaves and then enters the tooltip element within reasonable time", async () => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    let h2: HTMLElement = document.querySelector("h2");
    expect(h2).not.toBeNull();
    hoverOff(h2);
    await vi.advanceTimersByTimeAsync(100);
    hoverOn(h2);
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    h2 = document.querySelector("h2");
    expect(h2).not.toBeNull();
  });
});

@Component({
  imports: [TemplateTooltipDirective],
  template: `
    <div [appTemplateTooltip]="tooltip" [delayHide]="150" [delayShow]="1000">
      Show Tooltip
    </div>
    <ng-template #tooltip><h2>Custom Tooltip</h2></ng-template>
  `,
  standalone: true,
})
class MockComponent {}
