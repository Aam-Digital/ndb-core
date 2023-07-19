import { Component, HostBinding, Input } from "@angular/core";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

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
  animations: [
    trigger("translateTab", [
      // Transitions to `none` instead of 0, because some browsers might blur the content.
      state("center, void", style({ transform: "none" })),

      // If the tab is either on the left or right, we additionally add a `min-height` of 1px
      // in order to ensure that the element has a height before its state changes. This is
      // necessary because Chrome does seem to skip the transition in RTL mode if the element does
      // not have a static height and is not rendered. See related issue: #9465
      state(
        "left",
        style({
          transform: "translate(-110%)",
          minHeight: "1px",
          visibility: "hidden",
        })
      ),
      state(
        "right",
        style({
          transform: "translate(110%)",
          minHeight: "1px",
          visibility: "hidden",
        })
      ),

      transition("void => *", []),
      transition(
        "* => left, * => right, left => center, right => center",
        animate("800ms cubic-bezier(0.35, 0, 0.25, 1)")
      ),
    ]),
  ],
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
    this.animationState = posState;
  }

  @HostBinding("@translateTab") animationState = "";
}
