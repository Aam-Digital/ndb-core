import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouteTarget } from "../../../app.routing";
import { EntityConstructor } from "app/core/entity/model/entity";
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

type PropertyConfig = { name: string; schema: EntitySchemaField };
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
  ],
  standalone: true,
})
export class DataImportComponent implements OnInit {
  entityForm = new FormControl("", [Validators.required]);
  entity: EntityConstructor = Child;

  allProps: PropertyConfig[] = [];

  labelMapper = ({ name, schema }: PropertyConfig) => schema.label ?? name;
  isUsed = (option: PropertyConfig) =>
    this.columnMapping.some(({ property }) => property === option);

  columnMapping: ColumnConfig[] = [
    { column: "first", values: ["male", "female", ""] },
    { column: "second", values: ["yes", "no", "yes"] },
    { column: "third", values: ["01/01/2022", "03/02/2022", "31/03/2022"] },
  ];

  constructor(private matDialog: MatDialog) {}

  ngOnInit() {
    this.allProps = [...this.entity.schema.entries()].map(([name, schema]) => ({
      name,
      schema,
    }));
  }

  change() {}

  showEnumConfig(col: ColumnConfig) {
    this.matDialog.open(EnumValueMappingComponent, { data: col });
  }
}
