import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { IMPORT_VALUE_MAPPER_TOKEN } from "./import-column-mapping/import-value-mapping";
import { EnumValueMappingComponent } from "./import-column-mapping/enum-value-mapping/enum-value-mapping.component";
import { EnumValueMappingService } from "./import-column-mapping/enum-value-mapping/enum-value-mapping.service";
import { booleanEntitySchemaDatatype } from "../../core/entity/schema-datatypes/datatype-boolean";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({
  imports: [EnumValueMappingComponent],
  providers: [
    {
      provide: IMPORT_VALUE_MAPPER_TOKEN("configurable-enum"), // don't use ConfigurableEnumDatatype.name class name !== dataType name here
      useValue: "2",
    },
    {
      // if another value mapper is injected for same datatype, it is simply overwritten
      provide: IMPORT_VALUE_MAPPER_TOKEN("configurable-enum"),
      // providing these through native DI let's us use any services like schemaService within the mappingFn
      useClass: EnumValueMappingService,
    },
    {
      provide: IMPORT_VALUE_MAPPER_TOKEN(booleanEntitySchemaDatatype.name),
      useClass: EnumValueMappingService,
    },
  ],
})
export class ImportModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "Import",
        () =>
          import("./import/import.component").then((c) => c.ImportComponent),
      ],
    ]);
  }
}
