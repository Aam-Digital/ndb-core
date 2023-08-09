import { TestBed, waitForAsync } from "@angular/core/testing";
import moment from "moment";
import { Database } from "../core/database/database";
import { DemoDataService } from "../core/demo-data/demo-data.service";
import { SessionType } from "../core/session/session-type";
import { DatabaseTestingModule } from "./database-testing.module";
import { environment } from "../../environments/environment";

xdescribe("Performance Tests", () => {
  beforeEach(waitForAsync(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;

    environment.session_type = SessionType.mock; // change to SessionType.local to run performance tests with the InBrowser database

    await TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    }).compileComponents();
    const demoDataService = TestBed.inject(DemoDataService);
    const setup = new Timer();
    await demoDataService.publishDemoData();
    console.log("finished publishing demo data", setup.getDuration());
  }));

  afterEach(() => TestBed.inject(Database).destroy());

  it("basic test example", async () => {
    await comparePerformance(
      (num) => new Promise((resolve) => setTimeout(() => resolve(num), 100)),
      (num) => Promise.resolve(num),
      "Basic performance test example",
      [10, 20, 30],
    );
  });
});

async function comparePerformance<V, R>(
  currentFunction: (val?: V) => Promise<R>,
  improvedFunction: (val?: V) => Promise<R>,
  description: string,
  input?: V[],
) {
  const diffs: number[] = [];
  if (input) {
    for (const el of input) {
      const diff = await getExecutionDiff(
        () => currentFunction(el),
        () => improvedFunction(el),
      );
      diffs.push(diff);
    }
    const avgDiff = diffs.reduce((sum, cur) => sum + cur, 0) / diffs.length;
    fail("<" + description + "> Average improvement: " + avgDiff + "ms");
  } else {
    const diff = await getExecutionDiff(currentFunction, improvedFunction);
    fail("<" + description + "> Execution time improvement " + diff + "ms");
  }
}

async function getExecutionDiff<R>(
  currentFunction: () => Promise<R>,
  improvedFunction: () => Promise<R>,
): Promise<number> {
  const currentTimer = new Timer();
  const currentResult = await currentFunction();
  const currentDuration = currentTimer.getDuration();
  const improvedTimer = new Timer();
  const improvedResult = await improvedFunction();
  const improvedDuration = improvedTimer.getDuration();
  expect(improvedResult)
    .withContext(
      `current ${JSON.stringify(currentResult)}
      improved ${JSON.stringify(improvedResult)}`,
    )
    .toEqual(currentResult);
  return currentDuration - improvedDuration;
}

/**
 * Utility class to calculate duration of an action.
 */
class Timer {
  private startTime;
  private stopTime;

  constructor(start: boolean = true) {
    if (start) {
      this.start();
    }
  }

  start() {
    this.startTime = moment();
  }

  stop() {
    this.stopTime = moment();
    return this.getDuration();
  }

  getDuration() {
    return -this.startTime.diff(this.stopTime ?? moment(), "milliseconds");
  }
}
