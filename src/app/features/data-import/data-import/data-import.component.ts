import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { BehaviorSubject } from "rxjs";
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

type ColumnConfig = {
  column: string;
  schema?: EntitySchemaField;
  additional?: any;
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

  allProps: { name: string; schema: EntitySchemaField }[] = [];

  labelMapper = ({
    name,
    schema,
  }: {
    name: string;
    schema: EntitySchemaField;
  }) => schema.label ?? name;

  get unused(): { name: string; schema: EntitySchemaField }[] {
    return this.allProps.filter(
      ({ schema }) => !this.columnMapping.some((p) => p?.schema === schema)
    );
  }

  filteredProps = new BehaviorSubject<{ label: string; key: string }[]>([]);

  columnMapping: ColumnConfig[] = [
    { column: "first" },
    { column: "second" },
    { column: "third" },
  ];

  ngOnInit() {
    this.allProps = [...this.entity.schema.entries()].map(([name, schema]) => ({
      name,
      schema,
    }));
  }
}
