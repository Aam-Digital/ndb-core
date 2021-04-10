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
import { ChildrenService } from "../child-dev-project/children/children.service";
import { MockDatabase } from "../core/database/mock-database";
import { LoggingService } from "../core/logging/logging.service";
import { NewLocalSessionService } from "../core/session/session-service/new-local-session.service";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { Database } from "../core/database/database";
import { DemoDataService } from "../core/demo-data/demo-data.service";
import { SchoolsService } from "../child-dev-project/schools/schools.service";
import { EntityMapperService } from "../core/entity/entity-mapper.service";
import { School } from "../child-dev-project/schools/model/school";

describe("Performance Tests", () => {
  let mockSessionService: SessionService;
  let mockDatabase: MockDatabase;
  let demoDataService: DemoDataService;

  beforeEach(
    waitForAsync(() => {
      const loggingService = new LoggingService();
      mockDatabase = MockDatabase.createWithPouchDB(
        "performance_db",
        loggingService
      );
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
    const generateTimer = new Timer();
    await demoDataService.publishDemoData();
    expect(generateTimer.getDuration()).toBe(0, "Creating demo data");
  });

  it("should create demo data improved", async () => {
    const generateTimer = new Timer();
    await demoDataService.publishDemoDataImproved();
    expect(generateTimer.getDuration()).toBe(0, "Creating demo data improved");
  });

  it("children service response times", async () => {
    await demoDataService.publishDemoDataImproved();
    const indexTimer = new Timer();
    const childrenService = TestBed.inject<ChildrenService>(ChildrenService);
    await mockDatabase.waitForIndexing();

    expect(indexTimer.getDuration()).toBe(0, "Creating indices");

    const allChildrenTimer = new Timer();
    await childrenService.getChildren().toPromise();
    expect(allChildrenTimer.getDuration()).toBe(0, "Loading all children");
  });

  it("school service response times", async () => {
    await demoDataService.publishDemoDataImproved();
    const entityMapper = TestBed.inject(EntityMapperService);
    const schools = await entityMapper.loadType(School);
    const schoolsService = TestBed.inject(SchoolsService);
    await mockDatabase.waitForIndexing();
    const times = [];
    for (const school of schools) {
      const start = new Timer();
      await schoolsService
        .getChildrenForSchool(school.getId())
        .catch((err) => console.log("not found", err));
      times.push(start.getDuration());
    }
    const avgTime = times.reduce((sum, cur) => sum + cur, 0) / times.length;
    expect(avgTime).toBe(0, "Loading children avg time");
  });

  it("school service improved response times", async () => {
    await demoDataService.publishDemoDataImproved();
    const entityMapper = TestBed.inject(EntityMapperService);
    const schools = await entityMapper.loadType(School);
    const schoolsService = TestBed.inject(SchoolsService);
    await mockDatabase.waitForIndexing();
    const times = [];
    for (const school of schools) {
      const expected = await schoolsService.getChildrenForSchool(
        school.getId()
      );
      const start = new Timer();
      const actual = await schoolsService
        .getChildrenForSchoolImproved(school.getId())
        .catch((err) => console.log("not found", err));
      times.push(start.getDuration());
      expect(actual).toEqual(jasmine.arrayWithExactContents(expected));
    }
    const avgTime = times.reduce((sum, cur) => sum + cur, 0) / times.length;
    expect(avgTime).toBe(0, "Loading children improved avg time");
  });
});

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
