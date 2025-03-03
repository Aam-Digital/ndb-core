import { EntityConstructor } from "app/core/entity/model/entity";
import { ColumnMapping } from "../column-mapping";

export interface MappingDialogData {
  col: ColumnMapping;
  values: any[];
  entityType: EntityConstructor;
}
