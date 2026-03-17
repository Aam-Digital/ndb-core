import { fakeAsync, TestBed, tick } from "@angular/core/testing";
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
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    syncState = new BehaviorSubject<SyncState>(SyncState.UNSYNCED);
    mockEntityMapper = jasmine.createSpyObj("EntityMapperService", [
      "load",
      "save",
    ]);
    mockEntityMapper.save.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        AttendanceInitService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SyncStateSubject, useValue: syncState },
      ],
    });

    service = TestBed.inject(AttendanceInitService);
  });

  it("should save default attendance-status enum if none exists after sync completes", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith({ status: 404, name: "not_found" });

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        _id: `ConfigurableEnum:${ATTENDANCE_STATUS_CONFIG_ID}`,
        values: defaultAttendanceStatusTypes,
      }),
    );
  }));

  it("should not save default attendance-status enum if values already exist in DB", fakeAsync(() => {
    const existingEnum = new ConfigurableEnum(
      ATTENDANCE_STATUS_CONFIG_ID,
      defaultAttendanceStatusTypes,
    );
    mockEntityMapper.load.and.resolveTo(existingEnum);

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    tick();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  }));

  it("should save defaults if existing enum in DB has empty values", fakeAsync(() => {
    const emptyEnum = new ConfigurableEnum(ATTENDANCE_STATUS_CONFIG_ID, []);
    mockEntityMapper.load.and.resolveTo(emptyEnum);

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(emptyEnum);
    expect(emptyEnum.values).toEqual(defaultAttendanceStatusTypes);
  }));

  it("should not register defaults before sync completes", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith({ status: 404, name: "not_found" });

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.STARTED);
    tick();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  }));

  it("should abort if load fails with a non-404 error", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith(new Error("DB unavailable"));

    service.registerDefaultAttendanceStatusEnum();
    syncState.next(SyncState.COMPLETED);
    tick();

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  }));
});
