import { MonoTypeOperatorFunction, pipe } from "rxjs";
import { first, skipWhile } from "rxjs/operators";

/**
 * Waits until the state of a source observable is equal to the given
 * state, then emit that state. All other states are discarded.
 * <br/>After the state has changed to the desired state, subsequent states
 * are let through. if this desire is not intended, use the {@link filter} function
 * @param state The state to wait on
 * otherwise continues to emit values from the source observable
 */
export function waitForChangeTo<State>(
  state: State,
): MonoTypeOperatorFunction<State> {
  return pipe(
    skipWhile((nextState) => nextState !== state),
    first(),
  );
}
