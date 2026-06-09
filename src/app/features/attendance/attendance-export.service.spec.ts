import { TestBed } from "@angular/core/testing";
import { AttendanceExportService } from "./attendance-export.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DownloadService } from "#src/app/core/export/download-service/download.service";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  DatabaseEntity,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { AttendanceItem } from "./model/attendance-item";
import { NullAttendanceStatusType } from "./model/attendance-status";

@DatabaseEntity("AttendanceTestEntity")
class AttendanceTestEntity extends Entity {
  static override readonly ENTITY_TYPE = "AttendanceTestEntity";
  static override readonly label = "Test Event";
  static override readonly toStringAttributes = ["subject"];

  @DatabaseField({ label: "Subject" })
  subject: string;

  @DatabaseField({
    label: "Participants",
    dataType: "attendance",
    isArray: true,
  })
  participants: AttendanceItem[] = [];

  @DatabaseField({ label: "Linked Entity", dataType: "entity" })
  linkedEntity: string;
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

  beforeEach(() => {
    mockEntityMapper = { load: vi.fn() };
    mockDownloadService = {
      triggerDownload: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        AttendanceExportService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: DownloadService, useValue: mockDownloadService },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
      ],
    });

    service = TestBed.inject(AttendanceExportService);
  });

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

  it("should export one row per participant with only name, status and remarks", async () => {
    const entity = new AttendanceTestEntity();
    entity.subject = "Team Meeting";
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

    const alice = new Entity("Child:child-1");
    alice.toString = () => "Alice";
    const bob = new Entity("Child:child-2");
    bob.toString = () => "Bob";
    mockEntityMapper.load.mockImplementation((_type: string, id: string) =>
      id === "Child:child-1"
        ? Promise.resolve(alice)
        : id === "Child:child-2"
          ? Promise.resolve(bob)
          : Promise.reject(new Error("not found")),
    );

    await service.exportAttendanceList(entity, "participants");

    expect(mockDownloadService.triggerDownload).toHaveBeenCalledTimes(1);
    const [rows, format] = mockDownloadService.triggerDownload.mock.calls[0];
    expect(format).toBe("csv");
    expect(rows).toEqual([
      { Name: "Alice", Status: "Present", Remarks: "On time" },
      { Name: "Bob", Status: "Absent", Remarks: "Sick" },
    ]);
  });

  it("should not include entity columns or the participant id", async () => {
    const entity = new AttendanceTestEntity();
    entity.subject = "Event";
    entity.linkedEntity = "Child:child-9";
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

    const alice = new Entity("Child:child-1");
    alice.toString = () => "Alice";
    mockEntityMapper.load.mockResolvedValue(alice);

    await service.exportAttendanceList(entity, "participants");

    const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
    expect(Object.keys(rows[0])).toEqual(["Name", "Status", "Remarks"]);
  });

  it("should show <not_found> when the participant entity cannot be loaded", async () => {
    const entity = new AttendanceTestEntity();
    entity.participants = [
      new AttendanceItem(NullAttendanceStatusType, "", "Child:unknown-1"),
    ];
    mockEntityMapper.load.mockRejectedValue(new Error("not found"));

    await service.exportAttendanceList(entity, "participants");

    const [rows] = mockDownloadService.triggerDownload.mock.calls[0];
    expect(rows[0].Name).toBe("<not_found>");
  });

  it("should name the file after the entity toString with spaces replaced by dashes", async () => {
    const entity = new AttendanceTestEntity();
    entity.subject = "Team Meeting";
    entity.participants = [];

    await service.exportAttendanceList(entity, "participants");

    const [, , filename] = mockDownloadService.triggerDownload.mock.calls[0];
    expect(filename).toBe("Team-Meeting");
  });
});
