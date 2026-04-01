import { TestBed } from "@angular/core/testing";
import { AttendanceExportService } from "./attendance-export.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DownloadService } from "#src/app/core/export/download-service/download.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { AttendanceItem } from "./model/attendance-item";
import { NullAttendanceStatusType } from "./model/attendance-status";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";

@DatabaseEntity("AttendanceTestEntity")
class AttendanceTestEntity extends Entity {
  static override readonly ENTITY_TYPE = "AttendanceTestEntity";
  static override readonly label = "Test Event";
  static override readonly toStringAttributes = ["subject"];

  @DatabaseField({ label: "Subject" })
  subject: string;

  @DatabaseField({ label: "Date", dataType: "date" })
  date: Date;

  @DatabaseField({
    label: "Participants",
    dataType: "attendance",
    isArray: true,
  })
  participants: AttendanceItem[] = [];

  @DatabaseField({ label: "Linked Entity", dataType: "entity" })
  linkedEntity: string;

  @DatabaseField({ label: "status" })
  recordStatus: string;
}

@DatabaseEntity("NoAttendanceEntity")
class NoAttendanceEntity extends Entity {
  static override ENTITY_TYPE = "NoAttendanceEntity";

  @DatabaseField({ label: "Name" })
  name: string;
}

describe("AttendanceExportService", () => {
  let service: AttendanceExportService;
  let mockEntityMapper: { load: ReturnType<typeof vi.fn> };
  let mockDownloadService: { triggerDownload: ReturnType<typeof vi.fn> };
  let mockEntityActionsService: { anonymize: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockEntityMapper = {
      load: vi.fn(),
    };
    mockDownloadService = {
      triggerDownload: vi.fn().mockResolvedValue(undefined),
    };
    mockEntityActionsService = {
      anonymize: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AttendanceExportService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DownloadService, useValue: mockDownloadService },
        { provide: EntityActionsService, useValue: mockEntityActionsService },
        { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
      ],
    });

    service = TestBed.inject(AttendanceExportService);
  });

  describe("getAttendanceFields", () => {
    it("should detect attendance fields on an entity", () => {
      const entity = new AttendanceTestEntity();
      const fields = service.getAttendanceFields(entity);

      expect(fields).toHaveLength(1);
      expect(fields[0].fieldId).toBe("participants");
      expect(fields[0].label).toBe("Participants");
    });

    it("should return empty array for entity without attendance fields", () => {
      const entity = new NoAttendanceEntity();
      const fields = service.getAttendanceFields(entity);

      expect(fields).toHaveLength(0);
    });
  });

  describe("exportAttendanceList", () => {
    it("should export one row per participant with attendance and entity columns", async () => {
      const entity = new AttendanceTestEntity();
      entity.subject = "Team Meeting";
      entity.date = new Date("2025-06-15");
      entity.participants = [
        new AttendanceItem(
          {
            id: "PRESENT",
            label: "Present",
            shortName: "P",
            countAs: "PRESENT" as any,
          },
          "On time",
          "Child:child-1",
        ),
        new AttendanceItem(
          {
            id: "ABSENT",
            label: "Absent",
            shortName: "A",
            countAs: "ABSENT" as any,
          },
          "Sick",
          "Child:child-2",
        ),
      ];

      const mockChild1 = new Entity("Child:child-1");
      mockChild1.toString = () => "Alice";
      const mockChild2 = new Entity("Child:child-2");
      mockChild2.toString = () => "Bob";

      mockEntityMapper.load.mockImplementation((_type: string, id: string) => {
        if (id === "Child:child-1") return Promise.resolve(mockChild1);
        if (id === "Child:child-2") return Promise.resolve(mockChild2);
        return Promise.reject(new Error("not found"));
      });

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      expect(mockDownloadService.triggerDownload).toHaveBeenCalledTimes(1);

      const [rows, format, filename] =
        mockDownloadService.triggerDownload.mock.calls[0];

      expect(format).toBe("csv");
      expect(filename).toContain("AttendanceTestEntity");
      expect(filename).toContain("Participants");

      expect(rows).toHaveLength(2);

      // First row: Alice
      const row1 = rows[0];
      expect(row1["participant"]).toBe("Child:child-1");
      expect(row1["participant (readable)"]).toBe("Alice");
      expect(row1["Subject"]).toBe("Team Meeting");

      // Second row: Bob
      const row2 = rows[1];
      expect(row2["participant"]).toBe("Child:child-2");
      expect(row2["participant (readable)"]).toBe("Bob");
      expect(row2["Subject"]).toBe("Team Meeting");
    });

    it("should handle empty attendance list", async () => {
      const entity = new AttendanceTestEntity();
      entity.subject = "Empty Event";
      entity.participants = [];

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
      expect(rows).toHaveLength(0);
    });

    it("should use participant ID as fallback when entity cannot be loaded", async () => {
      const entity = new AttendanceTestEntity();
      entity.participants = [
        new AttendanceItem(NullAttendanceStatusType, "", "Child:unknown-1"),
      ];

      mockEntityMapper.load.mockRejectedValue(new Error("not found"));

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
      expect(rows[0]["participant (readable)"]).toBe("<not_found>");
    });

    it("should include entity-reference readable column for linked entity fields", async () => {
      const entity = new AttendanceTestEntity();
      entity.subject = "Event";
      entity.linkedEntity = "Child:child-1";
      entity.participants = [
        new AttendanceItem(NullAttendanceStatusType, "", "Child:child-2"),
      ];

      const mockChild1 = new Entity("Child:child-1");
      mockChild1.toString = () => "Alice";
      const mockChild2 = new Entity("Child:child-2");
      mockChild2.toString = () => "Bob";

      mockEntityMapper.load.mockImplementation((_type: string, id: string) => {
        if (id === "Child:child-1") return Promise.resolve(mockChild1);
        if (id === "Child:child-2") return Promise.resolve(mockChild2);
        return Promise.reject(new Error("not found"));
      });

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
      expect(rows[0]["Linked Entity"]).toBe("Child:child-1");
      expect(rows[0]["Linked Entity (readable)"]).toBe("Alice");
    });

    it("should exclude the attendance field itself from entity columns", async () => {
      const entity = new AttendanceTestEntity();
      entity.subject = "Event";
      entity.participants = [
        new AttendanceItem(NullAttendanceStatusType, "", "Child:child-1"),
      ];

      const mockChild = new Entity("Child:child-1");
      mockChild.toString = () => "Alice";
      mockEntityMapper.load.mockResolvedValue(mockChild);

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
      const keys = Object.keys(rows[0]);
      expect(keys).not.toContain("Participants");
    });

    it("should keep both values when attendance and entity columns share a label", async () => {
      const entity = new AttendanceTestEntity();
      entity.recordStatus = "Approved";
      entity.participants = [
        new AttendanceItem(
          {
            id: "PRESENT",
            label: "Present",
            shortName: "P",
            countAs: "PRESENT" as any,
          },
          "",
          "Child:child-1",
        ),
      ];

      const mockChild = new Entity("Child:child-1");
      mockChild.toString = () => "Alice";
      mockEntityMapper.load.mockResolvedValue(mockChild);

      await service.exportAttendanceList(
        entity,
        "participants",
        "Participants",
      );

      const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
      const statusColumns = Object.entries(rows[0]).filter(([key]) =>
        key.startsWith("status"),
      );

      expect(statusColumns).toHaveLength(2);
      expect(statusColumns.map(([, value]) => value)).toContain("Present");
      expect(statusColumns.map(([, value]) => value)).toContain("Approved");
    });
  });
});
