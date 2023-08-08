import { Injectable } from "@angular/core";
import { ImportValueMapping } from "../import-value-mapping";
import { ComponentType } from "@angular/cdk/overlay";
import { ColumnMapping } from "../../column-mapping";
import { EnumValueMappingComponent } from "./enum-value-mapping.component";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "../../../../core/entity/schema/entity-schema-field";

/**
 * Value mapper for imported data to enum or boolean options.
 */
@Injectable()
export class EnumValueMappingService implements ImportValueMapping {
  constructor(private schemaService: EntitySchemaService) {}

  configComponent: ComponentType<any> = EnumValueMappingComponent;

  mapFunction(
    val,
    schema: EntitySchemaField,
    additional: { [key: string]: any },
  ): any {
    this.schemaService.valueToEntityFormat(additional?.[val], schema);
  }

  incompleteAdditionalConfigBadge(col: ColumnMapping): string {
    if (!col.additional) {
      return "?";
    }
    const unmappedValues = Object.values(col.additional).filter(
      (v) => v === undefined,
    );
    if (unmappedValues.length > 0) {
      return unmappedValues.length.toString();
    }
    return undefined;
  }
}
