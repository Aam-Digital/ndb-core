import { DefaultDatatype } from "../schema/datatype-default";
import { Injectable } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay";
import { EnumValueMappingComponent } from "../../../features/import/import-column-mapping/enum-value-mapping/enum-value-mapping.component";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { ColumnMapping } from "../../../features/import/column-mapping";
import { getUnmappedValuesCounterBadge } from "../../configurable-enum/configurable-enum-datatype/configurable-enum.datatype";

@Injectable()
export class BooleanDatatype extends DefaultDatatype {
  static dataType = "boolean";

  editComponent = "EditBoolean";
  viewComponent = "DisplayCheckmark";

  transformToDatabaseFormat(value: boolean) {
    return value;
  }

  transformToObjectFormat(value) {
    return value;
  }

  importConfigComponent: ComponentType<any> = EnumValueMappingComponent;

  importMapFunction(
    val,
    schema: EntitySchemaField,
    additional: { [key: string]: any },
  ): any {
    return this.transformToObjectFormat(additional?.[val]);
  }

  importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return getUnmappedValuesCounterBadge(col);
  }
}
