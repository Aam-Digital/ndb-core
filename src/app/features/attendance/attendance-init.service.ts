import { inject, Injectable } from "@angular/core";
import { filter, first } from "rxjs";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { SyncState } from "#src/app/core/session/session-states/sync-state.enum";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ConfigurableEnum } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum";
import { ATTENDANCE_STATUS_CONFIG_ID } from "./model/attendance-status";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Registers a default attendance-status ConfigurableEnum if none exists in the database.
 * Waits until the first sync completes to avoid overwriting an existing enum that hasn't been synced yet.
 */
@Injectable()
export class AttendanceInitService {
  private readonly syncState = inject(SyncStateSubject);
  private readonly entityMapper = inject(EntityMapperService);

  registerDefaultAttendanceStatusEnum() {
    this.syncState
      .pipe(
        filter((state) => state === SyncState.COMPLETED),
        first(),
      )
      .subscribe(() => this.createDefaultEnumIfMissing());
  }

  private async createDefaultEnumIfMissing() {
    let existing: ConfigurableEnum | undefined;
    try {
      existing = await this.entityMapper.load(
        ConfigurableEnum,
        ATTENDANCE_STATUS_CONFIG_ID,
      );
      if (existing.values.length > 0) {
        return;
      }
    } catch (e: unknown) {
      const error = e as { status?: number; name?: string } | null;
      const isNotFound =
        !!error && (error.status === 404 || error.name === "not_found");
      if (!isNotFound) {
        Logging.debug("Failed to load attendance-status enum", e);
        return;
      }
    }

    if (existing) {
      existing.values = defaultAttendanceStatusTypes;
    } else {
      existing = new ConfigurableEnum(
        ATTENDANCE_STATUS_CONFIG_ID,
        defaultAttendanceStatusTypes,
      );
    }
    try {
      await this.entityMapper.save(existing);
    } catch (e) {
      Logging.debug("Could not save default attendance-status enum", e);
    }
  }
}
