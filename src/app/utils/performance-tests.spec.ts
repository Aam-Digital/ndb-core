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

import { TestBed, waitForAsync } from "@angular/core/testing";
import { SessionService } from "../core/session/session-service/session.service";
import { AppModule } from "../app.module";
import moment from "moment";
import { LoggingService } from "../core/logging/logging.service";
import { NewLocalSessionService } from "../core/session/session-service/new-local-session.service";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { Database } from "../core/database/database";
import { DemoDataService } from "../core/demo-data/demo-data.service";
import { SchoolsService } from "../child-dev-project/schools/schools.service";
import { EntityMapperService } from "../core/entity/entity-mapper.service";
import { School } from "../child-dev-project/schools/model/school";
import { ChildrenService } from "../child-dev-project/children/children.service";
import { PouchDatabase } from "../core/database/pouch-database";
import { RollCallSetupComponent } from "../child-dev-project/attendance/add-day-attendance/roll-call-setup/roll-call-setup.component";
import { User } from "../core/user/user";

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
    const schemaService = new EntitySchemaService();
    const mockSessionService = new NewLocalSessionService(
      loggingService,
      schemaService,
      mockDatabase
    );
    mockSessionService.currentUser = new User();

    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: Database, useValue: mockDatabase },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntitySchemaService, useValue: schemaService },
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

  it("school service get children of schools", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const schools = await entityMapper.loadType(School);
    const schoolsService = TestBed.inject(SchoolsService);
    await mockDatabase.getIndexCreationPromises();
    await comparePerformance(
      (school) => schoolsService.getChildrenForSchool(school.getId()),
      (school) => schoolsService.getChildrenForSchoolImproved(school.getId()),
      "Loading children of schools",
      schools
    );
  });

  it("load children with school info", async () => {
    const childrenService = TestBed.inject(ChildrenService);
    await mockDatabase.getIndexCreationPromises();
    await comparePerformance(
      () => childrenService.getChildren().toPromise(),
      () => childrenService.getChildrenImproved(),
      "ChildrenService getChildren"
    );
  });

  it("init activities in componentn", async () => {
    const fixture = TestBed.createComponent(RollCallSetupComponent);
    const rollCallSetup = fixture.componentInstance;
    await mockDatabase.getIndexCreationPromises();
    await comparePerformance(
      () => rollCallSetup.loadActivities(),
      () => rollCallSetup.loadActivitiesImproved(),
      "RollCallSetupComponent loadActivities"
    );
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
