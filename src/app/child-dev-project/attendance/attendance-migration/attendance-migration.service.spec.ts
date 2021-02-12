import { TestBed } from "@angular/core/testing";
import { AttendanceMigrationService } from "./attendance-migration.service";
import { AttendanceMonth } from "../model/attendance-month";
import { AttendanceStatus } from "../model/attendance-status";
import { Note } from "../../notes/model/note";
import { Database } from "../../../core/database/database";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { EntityModule } from "../../../core/entity/entity.module";
import PouchDB from "pouchdb-browser";
import { PouchDatabase } from "../../../core/database/pouch-database";
import { LoggingService } from "../../../core/logging/logging.service";
import { deleteAllIndexedDB } from "../../../utils/performance-tests.spec";
import { AttendanceService } from "../attendance.service";
import { expectEntitiesToBeInDatabase } from "../../../utils/expect-entity-data";

describe("AttendanceMigrationService", () => {
  let service: AttendanceMigrationService;
  let entitySchemaService: EntitySchemaService;
  let rawPouch;
  let testDatabase: Database;

  beforeEach(async () => {
    rawPouch = new PouchDB("unit-testing");
    testDatabase = new PouchDatabase(rawPouch, new LoggingService());

    TestBed.configureTestingModule({
      imports: [EntityModule],
      providers: [
        AttendanceMigrationService,
        { provide: Database, useValue: testDatabase },
      ],
    });
    service = TestBed.inject(AttendanceMigrationService);
    entitySchemaService = TestBed.inject(EntitySchemaService);
    // @ts-ignore
    await TestBed.inject(AttendanceService).createIndices();
  });

  afterEach(async () => {
    await rawPouch.close();
    await deleteAllIndexedDB(() => true);
  });

  it("should create events for each existing attendance-day in attendance-month", async () => {
    const testChild = "1";
    const testInstitution = "school";

    const old = AttendanceMonth.createAttendanceMonth(
      testChild,
      testInstitution
    );
    old.month = new Date("2020-01-01");
    old.dailyRegister[4].status = AttendanceStatus.EXCUSED;
    old.dailyRegister[4].remarks = "some remark";
    old.dailyRegister[5].status = AttendanceStatus.ABSENT;
    old.dailyRegister[7].status = AttendanceStatus.PRESENT;

    const expectedNotes: Note[] = [
      Note.create(old.dailyRegister[4].date, testInstitution),
      Note.create(old.dailyRegister[5].date, testInstitution),
      Note.create(old.dailyRegister[7].date, testInstitution),
    ];
    for (const event of expectedNotes) {
      event.category = service.activities.school.type;
      event.relatesTo = service.activities.school._id;
      event.children = [testChild];
    }
    expectedNotes[0].getAttendance(
      testChild
    ).status = defaultAttendanceStatusTypes.find((t) => t.shortName === "E");
    expectedNotes[0].getAttendance(testChild).remarks = "some remark";
    expectedNotes[1].getAttendance(
      testChild
    ).status = defaultAttendanceStatusTypes.find((t) => t.shortName === "A");
    expectedNotes[2].getAttendance(
      testChild
    ).status = defaultAttendanceStatusTypes.find((t) => t.shortName === "P");

    await service.createEventsForAttendanceMonth(old);

    await expectEntitiesToBeInDatabase(expectedNotes, true);
  });

  it("should add to existing event for the same activity and date", async () => {
    const testChild1 = "1";
    const testChild2 = "2";
    const testInstitution = "school";

    const old1 = AttendanceMonth.createAttendanceMonth(
      testChild1,
      testInstitution
    );
    old1.month = new Date("2020-01-01");
    old1.dailyRegister[0].status = AttendanceStatus.ABSENT;

    const old2 = AttendanceMonth.createAttendanceMonth(
      testChild2,
      testInstitution
    );
    old2.month = new Date("2020-01-01");
    old2.dailyRegister[0].status = AttendanceStatus.PRESENT;

    const expectedNotes: Note[] = [
      Note.create(old1.dailyRegister[0].date, testInstitution),
    ];
    for (const event of expectedNotes) {
      event.category = service.activities.school.type;
      event.relatesTo = service.activities.school._id;
      event.children = [testChild1, testChild2];
    }
    expectedNotes[0].getAttendance(
      testChild1
    ).status = defaultAttendanceStatusTypes.find((t) => t.shortName === "A");
    expectedNotes[0].getAttendance(
      testChild2
    ).status = defaultAttendanceStatusTypes.find((t) => t.shortName === "P");

    await service.createEventsForAttendanceMonth(old1);
    await service.createEventsForAttendanceMonth(old2);

    await expectEntitiesToBeInDatabase(expectedNotes, true);
  });
});
