import { EntityConstructor } from "app/core/entity/model/entity";
import { ColumnMapping } from "../column-mapping";
import { ImportAdditionalSettings } from "../import-additional-settings/import-additional-settings.component";

export interface MappingDialogData {
  col: ColumnMapping;
  values: any[];
  totalRowCount: number;
  entityType: EntityConstructor;
  additionalSettings?: ImportAdditionalSettings;
}
