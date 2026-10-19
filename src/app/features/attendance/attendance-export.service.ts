import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { DownloadService } from "#src/app/core/export/download-service/download.service";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { AttendanceItem } from "./model/attendance-item";
import { getReadableValue } from "#src/app/core/common-components/entities-table/value-accessor/value-accessor";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  EXPORT_BATCH_SIZE,
  loadReadableEntityName,
} from "#src/app/core/export/readable-entity-name";
import { mapInBatches } from "#src/app/utils/utils";

/**
 * Exports a simple attendance list as CSV for entities with attendance-typed fields.
 */
@Injectable({ providedIn: "root" })
export class AttendanceExportService {
  private readonly downloadService = inject(DownloadService);
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Detect all attendance fields on the given entity.
   * Returns field id and label for each attendance or legacy event-attendance-map field.
   */
  getAttendanceFields(
    entity: Entity,
  ): { fieldId: string; label: string; schemaField: EntitySchemaField }[] {
    return AttendanceDatatype.detectAllFieldsInEntity(entity).map((f) => ({
      ...f,
      label: f.schemaField.label || f.fieldId,
    }));
  }

  /**
   * Export an attendance field as a CSV with one row per participant.
   * Each row holds only the participant's name, status and remarks for a simple,
   * manageable list. The file is named after the entity's `toString()`.
   */
  async exportAttendanceList(entity: Entity, fieldId: string): Promise<void> {
    const items: AttendanceItem[] = entity[fieldId] ?? [];
    const nameCache = new Map<string, Promise<string>>();
    const rows = await mapInBatches(items, EXPORT_BATCH_SIZE, (item) =>
      this.buildParticipantRow(item, nameCache),
    );

    const filename = entity.toString().replaceAll(" ", "-");
    await this.downloadService.triggerDownload(
      rows.length > 0 ? rows : [this.buildRow("", "", "")],
      "csv",
      filename,
    );
  }

  private async buildParticipantRow(
    item: AttendanceItem,
    nameCache: Map<string, Promise<string>>,
  ): Promise<Record<string, string>> {
    return this.buildRow(
      await this.resolveParticipantName(item.participant, nameCache),
      getReadableValue(item.status) ?? "",
      item.remarks ?? "",
    );
  }

  private buildRow(
    name: string,
    status: string,
    remarks: string,
  ): Record<string, string> {
    return {
      [$localize`:Attendance export column header:Name`]: name,
      [$localize`:Attendance export column header:Status`]: status,
      [$localize`:Attendance export column header:Remarks`]: remarks,
    };
  }

  /**
   * Resolve a participant reference to its readable name via `toString()`,
   * falling back to "<not_found>" when the referenced entity does not exist.
   * A transient loading failure (e.g. connection problem) is not hidden behind
   * "<not_found>" but makes the export fail.
   */
  private async resolveParticipantName(
    participantId: string | undefined,
    nameCache: Map<string, Promise<string>>,
  ): Promise<string> {
    if (!participantId) {
      return "";
    }
    return loadReadableEntityName(
      this.entityMapper,
      undefined,
      participantId,
      nameCache,
    );
  }
}
