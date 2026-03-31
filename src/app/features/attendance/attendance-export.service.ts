import { inject, Injectable } from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";
import {
  ExportColumnResolver,
  buildExportColumnResolvers,
  DownloadService,
} from "#src/app/core/export/download-service/download.service";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { AttendanceItem } from "./model/attendance-item";
import { getReadableValue } from "#src/app/core/common-components/entities-table/value-accessor/value-accessor";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import moment from "moment";

/**
 * Exports attendance lists as CSV for entities with attendance-typed fields.
 */
@Injectable({ providedIn: "root" })
export class AttendanceExportService {
  private readonly downloadService = inject(DownloadService);
  private readonly entitySchemaService = inject(EntitySchemaService);

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
    const attendanceColumnResolvers = buildExportColumnResolvers(
      attendanceSchema,
      this.entitySchemaService,
      true,
    );

    const rows: Record<string, any>[] = [];
    for (const item of items) {
      const row: Record<string, any> = {};

      // Attendance item embedded fields from schema
      for (const [key, field] of attendanceSchema.entries()) {
        const label = field.label || key;
        row[label] = getReadableValue(item[key]);
      }

      await this.resolveExportColumns(
        row,
        item as Record<string, any>,
        attendanceColumnResolvers,
      );

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
    const columnResolvers = buildExportColumnResolvers(
      columns,
      this.entitySchemaService,
    );

    const row: Record<string, any> = {};
    await this.resolveExportColumns(row, raw, columnResolvers);

    return row;
  }

  private async resolveExportColumns(
    row: Record<string, any>,
    source: Record<string, any>,
    columnResolvers: ExportColumnResolver[],
  ): Promise<void> {
    for (const resolver of columnResolvers) {
      const resolvedValue = await resolver.column.resolveValue(
        source[resolver.sourceFieldId],
        resolver.schemaField,
      );

      row[resolver.column.label] = this.toCsvValue(resolvedValue);
    }
  }

  private toCsvValue(value: any): any {
    const readableValue = getReadableValue(value);

    if (readableValue instanceof Date) {
      return moment(readableValue).format("YYYY-MM-DD");
    }

    return Array.isArray(readableValue)
      ? readableValue.join(", ")
      : readableValue;
  }

  private buildFilename(entity: Entity, fieldLabel: string): string {
    const type = entity.getType();
    const id = entity.getId(true);
    const safeLabel = fieldLabel.replace(/[^a-zA-Z0-9]+/g, "-");
    return `${type}_${id}_${safeLabel}`;
  }
}
