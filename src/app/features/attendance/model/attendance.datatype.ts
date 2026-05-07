import { inject, Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem } from "./attendance-item";
import { AttendanceLogicalStatus } from "./attendance-status";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EventAttendanceMapDatatype } from "../deprecated/event-attendance-map.datatype";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  ExportColumnMapping,
  DefaultDatatype,
} from "#src/app/core/entity/default-datatype/default.datatype";

/**
 * Datatype for attendance tracking on any entity.
 *
 * Use this as `dataType: "attendance"` with `isArray: true` on an entity field
 * to store an array of {@link AttendanceItem} objects, each referencing a participant entity.
 *
 * The allowed entity types for the `participant` field can be overridden via
 * the field's `additional` config, e.g.:
 * ```json
 * {
 *   "dataType": "attendance",
 *   "isArray": true,
 *   "additional": {
 *     "participant": { "dataType": "entity", "additional": ["Child", "School"] }
 *   }
 * }
 * ```
 */
@Injectable()
export class AttendanceDatatype extends SchemaEmbedDatatype {
  private readonly entityMapper = inject(EntityMapperService);

  static override readonly dataType = "attendance";
  static override label: string = $localize`:datatype-label:attendance (participants with status)`;

  override embeddedType = AttendanceItem;

  override editComponent = "EditAttendance";
  override viewComponent = "DisplayAttendance";

  override normalizeSchemaField(
    schemaField: EntitySchemaField,
  ): EntitySchemaField {
    // attendance always requires isArray
    return { ...schemaField, isArray: true };
  }

  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping[] {
    if (!schemaField.label) {
      return [];
    }

    return [
      {
        keySuffix: "",
        label: schemaField.label + " (participation details)",
        resolveValue: async (value: AttendanceItem[]) => {
          const attendance = Array.isArray(value) ? value : [];
          const participantCache = new Map<string, Promise<string>>();

          const details = await Promise.all(
            attendance.map((attendanceItem) =>
              this.toParticipationDetails(attendanceItem, participantCache),
            ),
          );
          return details.join(", ");
        },
      },
      {
        keySuffix: "_participant_count",
        label: schemaField.label + " (number of participants)",
        resolveValue: (value: AttendanceItem[]) => {
          const attendance = Array.isArray(value) ? value : [];
          return attendance.length;
        },
      },
    ];
  }

  /**
   * Returns the attendance percentage (0–1) for use as the sort key in list columns.
   * Calculated as present / (present + absent), ignoring participants with IGNORE status (e.g. Excused).
   * Returns 0 if no participants have a countable status.
   */
  override sortValue(fieldValue: AttendanceItem[]): number {
    const items = Array.isArray(fieldValue) ? fieldValue : [];
    let present = 0;
    let counted = 0;
    for (const item of items) {
      const countAs = item.status?.countAs;
      if (countAs === AttendanceLogicalStatus.PRESENT) {
        present++;
        counted++;
      } else if (countAs === AttendanceLogicalStatus.ABSENT) {
        counted++;
      }
    }
    return counted > 0 ? present / counted : 0;
  }

  private async toParticipationDetails(
    attendanceItem: AttendanceItem,
    participantCache: Map<string, Promise<string>>,
  ): Promise<string> {
    const participant = await this.getParticipantReadable(
      attendanceItem,
      participantCache,
    );
    const statusLabel = this.getStatusLabel(attendanceItem);

    if (participant && statusLabel) {
      return `${participant} (${statusLabel})`;
    }

    if (participant) {
      return participant;
    }

    if (statusLabel) {
      return statusLabel;
    }

    return "";
  }

  private async getParticipantReadable(
    attendanceItem: AttendanceItem,
    participantCache: Map<string, Promise<string>>,
  ): Promise<string> {
    const participantId = attendanceItem?.participant;
    if (!participantId) {
      return "";
    }

    const cachedResult = participantCache.get(participantId);
    if (cachedResult) {
      return cachedResult;
    }

    const readableResultPromise = this.entityMapper
      .load(Entity.extractTypeFromId(participantId), participantId)
      .then((entity) => entity.toString())
      .catch(() => "<not_found>");

    participantCache.set(participantId, readableResultPromise);
    return readableResultPromise;
  }

  private getStatusLabel(attendanceItem: AttendanceItem): string {
    const status = attendanceItem?.status;
    if (!status) {
      return "";
    }

    if (typeof status === "string") {
      return status;
    }

    if (typeof status === "object" && "label" in status) {
      return status.label ?? "";
    }

    return "";
  }

  private static readonly ATTENDANCE_DATATYPES = [
    AttendanceDatatype.dataType,
    EventAttendanceMapDatatype.dataType,
  ];

  /** @override Detects the first `attendance` or legacy `event-attendance-map` field in the entity schema. */
  static override detectFieldInEntity(
    entityOrType: Entity | EntityConstructor,
  ): string | undefined {
    return DefaultDatatype.detectFieldInEntity(
      entityOrType,
      AttendanceDatatype.ATTENDANCE_DATATYPES,
    );
  }

  /** Detect all `attendance` or legacy `event-attendance-map` fields in the entity schema. */
  static override detectAllFieldsInEntity(
    entityOrType: Entity | EntityConstructor,
  ): { fieldId: string; schemaField: EntitySchemaField }[] {
    return DefaultDatatype.detectAllFieldsInEntity(
      entityOrType,
      AttendanceDatatype.ATTENDANCE_DATATYPES,
    );
  }
}
