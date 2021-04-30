import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { KeysPipe } from "./keys-pipe/keys.pipe";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatIconModule } from "@angular/material/icon";
import { FormDialogModule } from "../../form-dialog/form-dialog.module";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { MatTooltipModule } from "@angular/material/tooltip";

@NgModule({
  declarations: [EntitySubrecordComponent, KeysPipe],
  imports: [
    CommonModule,
    AlertsModule,
    MatSnackBarModule,
    FormDialogModule,
    EntityModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    ConfigurableEnumModule,
    MatTooltipModule,
  ],
  exports: [EntitySubrecordComponent, KeysPipe],
})
export class EntitySubrecordModule {}
