import { Component, HostBinding, Input } from "@angular/core";

/**
 * These position states are used internally as animation states for the tab body. Setting the
 * position state to left, right, or center will transition the tab body from its current
 * position to its respective state. If there is no current position (void, in the case of a new
 * tab body), then there will be no transition animation to its state.
 *
 * In the case of a new tab body that should immediately be centered with an animating transition,
 * then left-origin-center or right-origin-center can be used, which will use left or right as its
 * pseudo-prior state.
 */
type PositionState = "left" | "center" | "right";

@Component({
  selector: "app-roll-call-tab",
  template: "<ng-content></ng-content>",
  styleUrls: ["./roll-call-tab.component.scss"],
  standalone: true,
})
export class RollCallTabComponent {
  @Input()
  set position(position: number) {
    let posState: PositionState;
    if (position < 0) {
      posState = "left";
    } else if (position > 0) {
      posState = "right";
    } else {
      posState = "center";
    }
    this.positionClass = `tab-${posState}`;
  }

  @HostBinding("class") positionClass = "tab-center";
}
