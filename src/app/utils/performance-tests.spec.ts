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
import { Child } from "../child-dev-project/children/model/child";
import { InMemoryDatabase } from "../core/database/in-memory-database";

xdescribe("Performance Tests", () => {
  let mockSessionService: SessionService;
  let mockDatabase: InMemoryDatabase;
  let demoDataService: DemoDataService;

  beforeEach(
    waitForAsync(() => {
      const loggingService = new LoggingService();
      mockDatabase = InMemoryDatabase.create("performance_db", loggingService);
      const schemaService = new EntitySchemaService();
      mockSessionService = new NewLocalSessionService(
        loggingService,
        schemaService,
        mockDatabase
      );
      TestBed.configureTestingModule({
        imports: [AppModule],
        providers: [
          { provide: Database, useValue: mockDatabase },
          { provide: SessionService, useValue: mockSessionService },
          { provide: EntitySchemaService, useValue: schemaService },
          { provide: LoggingService, useValue: LoggingService },
        ],
      }).compileComponents();
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;
      demoDataService = TestBed.inject(DemoDataService);
    })
  );

  afterEach(
    waitForAsync(() => {
      return mockDatabase.destroy();
    })
  );

  it("created the demo data", async () => {
    const normalTimer = new Timer();
    await demoDataService.publishDemoData();
    fail(
      "<DemoDataService> publish demo data normal took " +
        normalTimer.getDuration()
    );
  });

  it("created the demo data improved", async () => {
    const normalTimer = new Timer();
    await demoDataService.publishDemoDataImproved();
    fail(
      "<DemoDataService> publish demo data improved took " +
        normalTimer.getDuration()
    );
  });

  it("school service get children of schools", async () => {
    const demoDataService = TestBed.inject(DemoDataService);
    await demoDataService.publishDemoDataImproved();
    const mockDatabase = TestBed.inject(Database) as InMemoryDatabase;
    const entityMapper = TestBed.inject(EntityMapperService);
    const schools = await entityMapper.loadType(School);
    const schoolsService = TestBed.inject(SchoolsService);
    await mockDatabase.waitForIndexing();
    await comparePerformance(
      (school) => schoolsService.getChildrenForSchool(school.getId()),
      (school) => schoolsService.getChildrenForSchoolImproved(school.getId()),
      "Loading children of schools",
      schools
    );
  });

  it("load children with school info", async () => {
    const demoDataService = TestBed.inject(DemoDataService);
    await demoDataService.publishDemoDataImproved();
    const mockDatabase = TestBed.inject(Database) as InMemoryDatabase;
    const childrenService = TestBed.inject(ChildrenService);
    await mockDatabase.waitForIndexing();
    await comparePerformance(
      () => childrenService.getChildren().toPromise(),
      () => childrenService.getChildrenImproved(),
      "ChildrenService getChildren"
    );
  });

  it("load children one by one", async () => {
    const demoDataService = TestBed.inject(DemoDataService);
    await demoDataService.publishDemoDataImproved();
    const mockDatabase = TestBed.inject(Database) as InMemoryDatabase;
    const childrenService = TestBed.inject(ChildrenService);
    await mockDatabase.waitForIndexing();
    const entityMapper = TestBed.inject(EntityMapperService);
    const children = await entityMapper.loadType(Child);
    await comparePerformance(
      (child) => childrenService.getChild(child.getId()).toPromise(),
      (child) => childrenService.getChildImproved(child.getId()),
      "ChildrenService getChild",
      children
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
