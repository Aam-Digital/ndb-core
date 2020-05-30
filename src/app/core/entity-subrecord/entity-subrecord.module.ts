import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { KeysPipe } from "./keys-pipe/keys.pipe";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../form-dialog/form-dialog.module";

/**
 * EntitySubrecord provides generic components to display and edit a list of entities
 * which are related to the "primary" entity whose details are currently displayed.
 *
 * For example, all Notes related to a certain Child are displayed within the Child's detail view
 * with the help of the {@link EntitySubrecordComponent}.
 */
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatSortModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    FormDialogModule,
    ConfirmationDialogModule,
  ],
  declarations: [EntitySubrecordComponent, KeysPipe],
  exports: [EntitySubrecordComponent, KeysPipe],
})
export class EntitySubrecordModule {}
