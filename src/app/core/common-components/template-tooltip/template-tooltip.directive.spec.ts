import { TemplateTooltipDirective } from "./template-tooltip.directive";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { Component } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("TemplateTooltipDirective", () => {
  let fixture: ComponentFixture<any>;

  function hoverOn(element: HTMLElement) {
    element.dispatchEvent(
      new MouseEvent("mouseenter", {
        view: window,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  function hoverOff(element: HTMLElement) {
    element.dispatchEvent(
      new MouseEvent("mouseleave", {
        view: window,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [MockComponent],
      imports: [TemplateTooltipDirective, NoopAnimationsModule],
    }).createComponent(MockComponent);
    fixture.detectChanges();
  });

  it("should not show the tooltip initially", () => {
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).toBeNull();
  });

  it("should show the tooltip after a certain period of time", fakeAsync(() => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    tick(1000);
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2.innerText).toBe("Custom Tooltip");
  }));

  it("should not show the tooltip when the user has stopped hovering before a threshold", fakeAsync(() => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    tick(750);
    hoverOff(div);
    tick(1000);
    const h2: HTMLElement = document.querySelector("h2");
    expect(h2).toBeNull();
  }));

  it("should hide the tooltip when the user's mouse leaves the tooltip element", fakeAsync(() => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    tick(1000);
    let h2: HTMLElement = document.querySelector("h2");
    hoverOff(h2);
    tick(1000);
    fixture.detectChanges();
    h2 = document.querySelector("h2");
    expect(h2).toBeNull();
  }));

  it("should not hide the tooltip when the user's mouse leaves and then enters the tooltip element within reasonable time", fakeAsync(() => {
    const div: HTMLElement = fixture.nativeElement.querySelector("div");
    hoverOn(div);
    tick(1000);
    let h2: HTMLElement = document.querySelector("h2");
    hoverOff(h2);
    tick(100);
    hoverOn(h2);
    tick(1000);
    fixture.detectChanges();
    h2 = document.querySelector("h2");
    expect(h2).not.toBeNull();
  }));
});

@Component({
  template: `
    <div [appTemplateTooltip]="tooltip" [delayHide]="150" [delayShow]="1000">
      Show Tooltip
    </div>
    <ng-template #tooltip><h2>Custom Tooltip</h2></ng-template>
  `,
})
class MockComponent {}
