import { TestBed } from "@angular/core/testing";
import type { Mock } from "vitest";
import { BehaviorSubject } from "rxjs";
import { SyncState } from "#src/app/core/session/session-states/sync-state.enum";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ATTENDANCE_STATUS_CONFIG_ID } from "./model/attendance-status";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { AttendanceInitService } from "./attendance-init.service";
import { ConfigurableEnum } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum";

describe("AttendanceInitService", () => {
  let service: AttendanceInitService;
  let syncState: BehaviorSubject<SyncState>;
  let mockEntityMapper: {
    load: Mock;
    save: Mock;
  };

  beforeEach(() => {
    syncState = new BehaviorSubject<SyncState>(SyncState.UNSYNCED);
    mockEntityMapper = {
      load: vi.fn().mockName("EntityMapperService.load"),
      save: vi.fn().mockName("EntityMapperService.save"),
    };
    mockEntityMapper.save.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        AttendanceInitService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SyncStateSubject, useValue: syncState },
      ],
    });

    service = TestBed.inject(AttendanceInitService);
  });

  async function flushAsyncWork() {
    await Promise.resolve();
    await Promise.resolve();
  }

  it("should save default attendance-status enum if none exists after sync completes", async () => {
    mockEntityMapper.load.mockRejectedValue({ status: 404, name: "not_found" });

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    await flushAsyncWork();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: `ConfigurableEnum:${ATTENDANCE_STATUS_CONFIG_ID}`,
        values: defaultAttendanceStatusTypes,
      }),
    );
  });

  it("should not save default attendance-status enum if values already exist in DB", async () => {
    const existingEnum = new ConfigurableEnum(
      ATTENDANCE_STATUS_CONFIG_ID,
      defaultAttendanceStatusTypes,
    );
    mockEntityMapper.load.mockResolvedValue(existingEnum);

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    await flushAsyncWork();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should save defaults if existing enum in DB has empty values", async () => {
    const emptyEnum = new ConfigurableEnum(ATTENDANCE_STATUS_CONFIG_ID, []);
    mockEntityMapper.load.mockResolvedValue(emptyEnum);

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    await flushAsyncWork();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(emptyEnum);
    expect(emptyEnum.values).toEqual(defaultAttendanceStatusTypes);
  });

  it("should not register defaults before sync completes", async () => {
    mockEntityMapper.load.mockRejectedValue({ status: 404, name: "not_found" });

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.STARTED);
    await flushAsyncWork();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should abort if load fails with a non-404 error", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("DB unavailable"));

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    await flushAsyncWork();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });
});
