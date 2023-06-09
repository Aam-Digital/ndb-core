import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouteTarget } from "../../../app.routing";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { InputFileComponent } from "../input-file/input-file.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { AsyncPipe, KeyValuePipe, NgForOf, NgIf } from "@angular/common";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { BasicAutocompleteComponent } from "../../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { DisplayEntityComponent } from "../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { Child } from "../../../child-dev-project/children/model/child";
import { MatDialog } from "@angular/material/dialog";
import { EnumValueMappingComponent } from "./enum-value-mapping/enum-value-mapping.component";
import { DataImportService } from "../data-import.service";
import { DateValueMappingComponent } from "./date-value-mapping/date-value-mapping.component";
import { ComponentType } from "@angular/cdk/overlay";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import moment from "moment";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

type PropertyConfig = {
  name: string;
  schema: EntitySchemaField;
  mappingCmp?: ComponentType<any>;
  mappingFn?: (val: any, cal: ColumnConfig) => any;
};
// TODO rename (duplicate in subrecord)
export type ColumnConfig = {
  column: string;
  property?: PropertyConfig;
  additional?: any;
  values: string[];
};

@RouteTarget("Import")
@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    KeyValuePipe,
    MatExpansionModule,
    MatInputModule,
    MatButtonModule,
    NgIf,
    NgForOf,
    MatAutocompleteModule,
    AsyncPipe,
    InputFileComponent,
    BasicAutocompleteComponent,
    DisplayEntityComponent,
    MatTooltipModule,
    FormsModule,
    EntitySubrecordComponent,
  ],
  standalone: true,
})
export class DataImportComponent implements OnInit {
  data = [
    { first: "male", second: "yes", third: "01/01/2022" },
    { first: "female", second: "no", third: "03/02/2022" },
    { first: "", second: "yes", third: "31/03/2022" },
    { first: "male", second: "", third: "15/03/2022" },
    { first: "", second: "yes", third: "15/03/2021" },
  ];

  entityForm = new FormControl("", [Validators.required]);
  entity: EntityConstructor = Child;

  allProps: PropertyConfig[] = [];

  labelMapper = ({ name, schema }: PropertyConfig) => schema.label ?? name;
  isUsed = (option: PropertyConfig) =>
    this.columnMapping.some(({ property }) => property === option);

  // TODO maybe use object/map instead
  columnMapping: ColumnConfig[] = [];

  mappedEntities: Entity[] = [];
  columns: string[] = [];

  constructor(
    private matDialog: MatDialog,
    private importService: DataImportService,
    private confirmation: ConfirmationDialogService,
    private schemaService: EntitySchemaService
  ) {}

  ngOnInit() {
    // TODO filter out the ones without a label as they are internal?
    this.allProps = [...this.entity.schema.entries()].map(([name, schema]) => ({
      name,
      schema,
      ...this.getMappingComponent(schema),
    }));
    const tmp: { [s: string]: Set<any> } = {};
    this.data.forEach((row) =>
      Object.entries(row).forEach(([key, value]) => {
        if (!tmp[key]) {
          tmp[key] = new Set();
        }
        tmp[key].add(value);
      })
    );
    this.columnMapping = Object.entries(tmp).map(([key, value]) => ({
      column: key,
      values: [...value],
    }));
  }

  change() {}

  private getMappingComponent(schema: EntitySchemaField) {
    if (
      schema.dataType === "boolean" ||
      schema.dataType === "configurable-enum" ||
      schema.innerDataType === "configurable-enum"
    ) {
      return {
        mappingCmp: EnumValueMappingComponent,
        mappingFn: (val, col: ColumnConfig) => col.additional[val],
      };
    }
    if (this.importService.dateDataTypes.includes(schema.dataType)) {
      return {
        mappingCmp: DateValueMappingComponent,
        mappingFn: (val, col: ColumnConfig) =>
          moment(val, col.additional, true).toDate(),
      };
    }
  }

  openMappingComponent(col: ColumnConfig) {
    this.matDialog.open(col.property.mappingCmp, {
      data: col,
      disableClose: true,
    });
  }

  async import() {
    const allUsed = this.columnMapping.every((col) => this.hasMapping(col));
    const confirmed =
      allUsed ||
      (await this.confirmation.getConfirmation(
        $localize`Mappings missing`,
        $localize`Some columns don't have a mapping and will not be imported. Do you still want to start the import now?`
      ));
    if (confirmed) {
      this.mappedEntities = this.data.map((row) => {
        const e = new this.entity();
        Object.entries(row).forEach(([col, val]) => {
          const prop = this.columnMapping.find(({ column }) => column === col);
          if (prop.property) {
            let parsed;
            if (prop.property.mappingFn) {
              parsed = prop.property.mappingFn(val, prop);
            } else {
              parsed = this.schemaService
                .getDatatypeOrDefault(prop.property.schema.dataType)
                .transformToObjectFormat(
                  val,
                  prop.property.schema,
                  this.schemaService,
                  e
                );
            }
            if (parsed) {
              e[prop.property.name] = parsed;
            }
          }
        });
        return e;
      });
      this.columns = this.columnMapping
        .filter(({ property }) => !!property)
        .map(({ property }) => property.name);
    }
  }

  private hasMapping(col: ColumnConfig) {
    return (
      col.property &&
      (!col.property.mappingCmp || (col.property.mappingCmp && col.additional))
    );
  }

  clear() {
    this.columnMapping.forEach((col) => {
      delete col.property;
      delete col.additional;
    });
  }
}
