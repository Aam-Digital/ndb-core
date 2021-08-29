
import { TestBed, waitForAsync } from "@angular/core/testing";
import { SessionService } from "../core/session/session-service/session.service";
import { AppModule } from "../app.module";
import moment from "moment";
import { LoggingService } from "../core/logging/logging.service";
import { Database } from "../core/database/database";
import { DemoDataService } from "../core/demo-data/demo-data.service";
import { PouchDatabase } from "../core/database/pouch-database";
import { LocalSession } from "app/core/session/session-service/local-session";

xdescribe("Performance Tests", () => {
  let mockDatabase: PouchDatabase;

  beforeEach(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;

    const loggingService = new LoggingService();
    // Uncomment this line to run performance tests with the InBrowser database.
    // mockDatabase = PouchDatabase.createWithIndexedDB(
    mockDatabase = PouchDatabase.createWithInMemoryDB(
      "performance_db",
      loggingService
    );
    const mockSessionService = new LocalSession(
      mockDatabase
    );

    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: Database, useValue: mockDatabase },
        { provide: SessionService, useValue: mockSessionService },
        { provide: LoggingService, useValue: loggingService },
      ],
    }).compileComponents();
    const demoDataService = TestBed.inject(DemoDataService);
    const setup = new Timer();
    await demoDataService.publishDemoData();
    console.log("finished publishing demo data", setup.getDuration());
  });

  afterEach(
    waitForAsync(() => {
      return mockDatabase.destroy();
    })
  );

  it("basic test example", async () => {
    await comparePerformance(
      (num) => new Promise((resolve) =>
        setTimeout(() => resolve(num), 100)),
      (num) => Promise.resolve(num),
      "Basic performance test example",
      [10, 20, 30]
    )
  });
});

async function comparePerformance<V, R>(
  currentFunction: (val?: V) => Promise<R>,
  improvedFunction: (val?: V) => Promise<R>,
  description: string,
  input?: V[]
) {
  const diffs: number[] = [];
  if (input) {
    for (const el of input) {
      const diff = await getExecutionDiff(
        () => currentFunction(el),
        () => improvedFunction(el)
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
  improvedFunction: () => Promise<R>
): Promise<number> {
  const currentTimer = new Timer();
  const currentResult = await currentFunction();
  const currentDuration = currentTimer.getDuration();
  const improvedTimer = new Timer();
  const improvedResult = await improvedFunction();
  const improvedDuration = improvedTimer.getDuration();
  expect(improvedResult).toEqual(
    currentResult,
    "current " +
      JSON.stringify(currentResult) +
      " improved " +
      JSON.stringify(improvedResult)
  );
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
