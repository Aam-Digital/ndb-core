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

import { PerformanceAnalysisLogging } from "./performance-analysis-logging";

class TestClass {
  public result: string;

  @PerformanceAnalysisLogging
  async testFun(max: number, other?: number) {
    let result = 0;
    for (let x = 0; x < max; x++) {
      result += Math.sqrt(x);
    }
    return [this.result, max, other];
  }
}

describe("PerformanceAnalysisLogging Util Tests", () => {
  beforeEach(() => {});

  it("should add performance measurement and log duration", async () => {
    spyOn(console, "log");

    const instance = new TestClass();
    await instance.testFun(99);

    expect(console.log).toHaveBeenCalledWith(
      'duration [s] "TestClass.testFun"',
      jasmine.any(Number)
    );
  });

  it("should add performance measurement and correctly pass context and arguments to original method", async () => {
    const testResult = "OK";
    const testArg1 = 99;
    const testArg2 = 1;

    const instance = new TestClass();
    instance.result = testResult;
    const actualResult = await instance.testFun(testArg1, testArg2);

    expect(actualResult[0]).toBe(testResult);
    expect(actualResult[1]).toBe(testArg1);
    expect(actualResult[2]).toBe(testArg2);
  });
});
