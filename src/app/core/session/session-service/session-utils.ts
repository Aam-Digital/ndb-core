import { MonoTypeOperatorFunction, of, pipe, throwError } from "rxjs";
import { first, mergeMap, skipWhile } from "rxjs/operators";

/**
 * Waits until the state of a source observable is equal to the given
 * state, then emit that state. All other states are discarded.
 * <br/>After the state has changed to the desired state, subsequent states
 * are let through. if this desire is not intended, use the {@link filter} function
 * @param state The state to wait on
 * @param thenComplete when `true`, completes the subscription and send a completion message,
 * otherwise continues to emit values from the source observable
 */
export function waitForChangeTo<State>(
  state: State,
  thenComplete: boolean = false
): MonoTypeOperatorFunction<State> {
  if (thenComplete) {
    return pipe(
      skipWhile((nextState) => nextState !== state),
      first()
    );
  } else {
    return skipWhile((nextState) => nextState !== state);
  }
}

/**
 * Fails (throws a supplied error) when a given state
 * does not appear
 * @param states
 */
export function failOnStates<State>(
  states: State[]
): MonoTypeOperatorFunction<State> {
  return mergeMap((nextState) => {
    if (states.includes(nextState)) {
      return throwError(nextState);
    } else {
      return of(nextState);
    }
  });
}
