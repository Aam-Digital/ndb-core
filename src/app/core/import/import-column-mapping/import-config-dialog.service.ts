import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { ColumnMapping } from "../column-mapping";
import { EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ComponentRegistry } from "../../../dynamic-components";
import { ImportAdditionalSettings } from "../import-additional-settings";
import { MappingDialogData } from "./mapping-dialog-data";

/**
 * Open the dialog through which a column's import values are configured
 * (e.g. value mappings for dropdowns or the format of dates),
 * as defined by the datatype of the mapped field.
 */
@Injectable({ providedIn: "root" })
export class ImportConfigDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly components = inject(ComponentRegistry);
  private readonly schemaService = inject(EntitySchemaService);

  /**
   * Whether the field the given column is mapped to requires configuration in a dialog.
   */
  hasConfigDialog(col: ColumnMapping, entityType: EntityConstructor): boolean {
    return !!this.getConfigDialogName(col, entityType);
  }

  /**
   * Let the user configure how the column's values are imported
   * and return the resulting column mapping.
   *
   * The given mapping is left unchanged, if the user cancels or the datatype has no dialog.
   */
  async openConfigDialog(
    col: ColumnMapping,
    rawData: any[],
    entityType: EntityConstructor,
    additionalSettings?: ImportAdditionalSettings,
  ): Promise<ColumnMapping> {
    const dialogName = this.getConfigDialogName(col, entityType);
    if (!dialogName) {
      return col;
    }

    const dialogComponent = await this.components.get(dialogName)();
    const uniqueValues = new Set<any>(rawData.map((row) => row[col.column]));
    // the dialog writes the user's settings into the given mapping, so pass a copy of it
    const data: MappingDialogData = {
      col: { ...col },
      values: [...uniqueValues],
      totalRowCount: rawData.length,
      entityType: entityType,
      additionalSettings: additionalSettings,
    };

    await firstValueFrom(
      this.dialog
        .open(dialogComponent, { data, width: "80vw", disableClose: true })
        .afterClosed(),
    );

    return data.col;
  }

  private getConfigDialogName(
    col: ColumnMapping,
    entityType: EntityConstructor,
  ): string | undefined {
    const schema = entityType?.schema?.get(col?.propertyName);
    if (!schema) {
      return undefined;
    }
    return this.schemaService.getDatatypeOrDefault(schema.dataType)
      .importConfigDialog;
  }
}
