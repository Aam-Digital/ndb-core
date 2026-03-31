import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DownloadService } from "#src/app/core/export/download-service/download.service";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { AttendanceItem } from "./model/attendance-item";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import {
  getReadableValue,
  transformToReadableFormat,
} from "#src/app/core/common-components/entities-table/value-accessor/value-accessor";

/**
 * Exports attendance lists as CSV for entities with attendance-typed fields.
 */
@Injectable({ providedIn: "root" })
export class AttendanceExportService {
  private entityMapper = inject(EntityMapperService);
  private downloadService = inject(DownloadService);

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
   * Export an attendance field as CSV with one row per participant.
   * Columns: attendance item fields (participant ID, participant name, status, remarks, ...)
   *          + all labeled entity fields (duplicated per row).
   */
  async exportAttendanceList(
    entity: Entity,
    fieldId: string,
    fieldLabel: string,
  ): Promise<void> {
    const items: AttendanceItem[] = entity[fieldId] ?? [];
    const entityColumns = this.buildEntityColumns(entity, fieldId);
    const entityRow = await this.buildEntityRow(entity, entityColumns);
    const attendanceSchema = this.getEffectiveAttendanceSchema(
      entity.getConstructor().schema.get(fieldId),
    );

    const rows: Record<string, any>[] = [];
    for (const item of items) {
      const row: Record<string, any> = {};

      // Attendance item embedded fields from schema
      for (const [key, field] of attendanceSchema.entries()) {
        const label = field.label || key;
        row[label] = getReadableValue(item[key]);

        if (field.dataType === EntityDatatype.dataType) {
          row[label + " (readable)"] = await this.resolveEntityName(item[key]);
        }
      }

      // event entity fields (duplicated for each row)
      Object.assign(row, entityRow);

      rows.push(row);
    }

    const filename = this.buildFilename(entity, fieldLabel);
    await this.downloadService.triggerDownload(rows, "csv", filename);
  }

  /**
   * Build the effective schema for the attendance embedded type,
   * merging AttendanceItem's annotations with any `additional` overrides from the field config.
   */
  private getEffectiveAttendanceSchema(
    schemaField?: EntitySchemaField,
  ): EntitySchema {
    const base: EntitySchema = new Map(AttendanceItem.schema);
    const additional = schemaField?.additional ?? {};
    for (const [key, value] of Object.entries(additional)) {
      base.set(key, { ...(value as EntitySchemaField), id: key });
    }
    return base;
  }

  private buildEntityColumns(
    entity: Entity,
    excludeFieldId: string,
  ): Map<string, EntitySchemaField> {
    const columns = new Map<string, EntitySchemaField>();
    const schema = entity.getConstructor().schema;

    for (const [id, field] of schema.entries()) {
      if (!field.label || field.isInternalField) continue;
      if (id === excludeFieldId) continue;
      columns.set(id, field);
    }

    return columns;
  }

  private async buildEntityRow(
    entity: Entity,
    columns: Map<string, EntitySchemaField>,
  ): Promise<Record<string, any>> {
    const raw: Record<string, any> = {};
    for (const [id, field] of columns.entries()) {
      raw[id] = entity[id];
    }
    const readable = transformToReadableFormat(raw);

    const row: Record<string, any> = {};
    for (const [id, field] of columns.entries()) {
      row[field.label] = readable[id];

      if (field.dataType === EntityDatatype.dataType) {
        row[field.label + " (readable)"] = await this.resolveEntityName(
          entity[id],
        );
      }
    }

    return row;
  }

  private async resolveEntityName(
    value: string | string[] | undefined,
  ): Promise<string> {
    if (!value) return "";

    const ids = Array.isArray(value) ? value : [value];
    const names: string[] = [];

    for (const id of ids) {
      try {
        const loaded = await this.entityMapper.load(
          Entity.extractTypeFromId(id),
          id,
        );
        names.push(loaded.toString());
      } catch {
        names.push(id);
      }
    }

    return names.join(", ");
  }

  private buildFilename(entity: Entity, fieldLabel: string): string {
    const type = entity.getType();
    const id = entity.getId(true);
    const safeLabel = fieldLabel.replace(/[^a-zA-Z0-9]+/g, "-");
    return `${type}_${id}_${safeLabel}`;
  }
}
