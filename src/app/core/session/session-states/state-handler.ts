/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { EventEmitter } from "@angular/core";

/**
 * Interface of state transition events.
 */
export interface StateChangedEvent<StateEnum> {
  /** previous state before change */
  fromState: StateEnum;

  /** new state after change */
  toState: StateEnum;
}

/**
 * Utility class supporting generic state transitions by emitting change events
 * and allowing to wait for a certain state transition.
 */
export class StateHandler<StateEnum> {
  private state: StateEnum;
  private stateChanged: EventEmitter<StateChangedEvent<StateEnum>> =
    new EventEmitter<StateChangedEvent<StateEnum>>();

  /**
   * Create a StateHandler helper.
   * @param defaultState Optional initial state.
   */
  constructor(defaultState?: StateEnum) {
    this.state = defaultState;
  }

  /**
   * Get the current state.
   */
  public getState(): StateEnum {
    return this.state;
  }

  /**
   * Change to the given new state.
   * The state handler ensures an event is emitted.
   * @param state The new state
   */
  public setState(state: StateEnum): StateHandler<StateEnum> {
    const oldState = this.state;
    this.state = state;
    this.stateChanged.emit({
      fromState: oldState,
      toState: this.state,
    });
    return this;
  }

  /**
   * Subscribe to all state change events.
   */
  public getStateChangedStream(): EventEmitter<StateChangedEvent<StateEnum>> {
    return this.stateChanged;
  }

  /**
   * Subscribe to a certain state transition.
   * @param toState The state for which to wait for and resolve the Promise.
   * @param failOnStates Optional array of states for which the reject the Promise.
   */
  public waitForChangeTo(
    toState: StateEnum,
    failOnStates?: StateEnum[]
  ): Promise<StateChangedEvent<StateEnum>> {
    return new Promise((resolve, reject) => {
      if (this.getState() === toState) {
        resolve({ fromState: undefined, toState });
        return;
      } else if (failOnStates && failOnStates.includes(this.getState())) {
        reject({ fromState: undefined, toState: this.getState() });
        return;
      }
      const subscription = this.getStateChangedStream().subscribe((change) => {
        if (change.toState === toState) {
          subscription.unsubscribe(); // only once
          resolve(change);
        } else if (failOnStates && failOnStates.includes(change.toState)) {
          subscription.unsubscribe(); // only once
          reject(change);
        }
      });
    });
  }
}
