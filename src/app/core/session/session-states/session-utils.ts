import { MonoTypeOperatorFunction, pipe } from "rxjs";
import { filter, first, skipWhile } from "rxjs/operators";

/**
 * Waits until the state of a source observable is equal to the given
 * state, then emit that state. All other states are discarded.
 * <br/>After the state has changed to the desired state, subsequent states
 * are let through. if this desire is not intended, use the {@link filter} function
 * @param state The state to wait on
 * @param onlyFirst whether the observable should complete after the first match
 * otherwise continues to emit values from the source observable
 */
export function waitForChangeTo<State>(
  state: State,
  onlyFirst: boolean = true
): MonoTypeOperatorFunction<State> {
  if (onlyFirst) {
    return pipe(
      skipWhile((nextState) => nextState !== state),
      first()
    );
  } else {
    return pipe(filter((nextState) => nextState === state));
  }
}
