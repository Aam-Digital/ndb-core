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

import { waitForAsync } from "@angular/core/testing";
import { StateHandler } from "./state-handler";

enum TestState {
  test1,
  test2,
  test3,
  test4,
}

describe("StateHandler", () => {
  it("is initiated with the correct Initial State", () => {
    const handler = new StateHandler<TestState>(TestState.test1);
    expect(handler.getState()).toEqual(TestState.test1);
  });
  it("changes the state when setting the state", () => {
    const handler = new StateHandler<TestState>(TestState.test1);
    handler.setState(TestState.test2);
    expect(handler.getState()).toEqual(TestState.test2);
  });
  it("emits an event when setting the state", (done) => {
    const handler = new StateHandler<TestState>(TestState.test1);
    handler.getStateChangedStream().subscribe((stateChangeEvent) => {
      expect(stateChangeEvent.fromState).toEqual(TestState.test1);
      expect(stateChangeEvent.toState).toEqual(TestState.test2);
      done();
    });
    handler.setState(TestState.test2);
  });
  it(
    "waits for the state to change to a specific value",
    waitForAsync(() => {
      const handler = new StateHandler<TestState>(TestState.test1);
      handler.waitForChangeTo(TestState.test2).then(() => {
        expect(handler.getState()).toEqual(TestState.test2);
      });
      handler.setState(TestState.test3);
      handler.setState(TestState.test2);
    })
  );
  it(
    "fails waiting for the state to change to a specific value if specified",
    waitForAsync(() => {
      const handler = new StateHandler<TestState>(TestState.test1);
      handler.waitForChangeTo(TestState.test2, [TestState.test3]).catch(() => {
        expect(handler.getState()).toEqual(TestState.test3);
      });
      handler.setState(TestState.test4);
      handler.setState(TestState.test3);
    })
  );
});
