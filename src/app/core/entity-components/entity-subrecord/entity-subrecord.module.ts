import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { KeysPipe } from "./keys-pipe/keys.pipe";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatIconModule } from "@angular/material/icon";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewModule } from "../../view/view.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { ConfirmationDialogModule } from "../../confirmation-dialog/confirmation-dialog.module";
import { DisplayEntityComponent } from "./view-components/display-entity/display-entity.component";
import { DisplayEntityArrayComponent } from "./view-components/display-entity-array/display-entity-array.component";
import { DisplayTextComponent } from "./view-components/display-text/display-text.component";
import { DisplayDateComponent } from "./view-components/display-date/display-date.component";
import { DisplayConfigurableEnumComponent } from "./view-components/display-configurable-enum/display-configurable-enum.component";
import { DisplayCheckmarkComponent } from "./view-components/display-checkmark/display-checkmark.component";
import { ReadonlyFunctionComponent } from "./view-components/readonly-function/readonly-function.component";
import { DisplayPercentageComponent } from "./view-components/display-percentage/display-percentage.component";
import { DisplayUnitComponent } from "./view-components/display-unit/display-unit.component";

@NgModule({
  declarations: [
    EntitySubrecordComponent,
    KeysPipe,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
  ],
  imports: [
    CommonModule,
    AlertsModule,
    MatSnackBarModule,
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
    MatTooltipModule,
    ViewModule,
    ReactiveFormsModule,
    EntityFormModule,
    ConfirmationDialogModule,
  ],
  exports: [EntitySubrecordComponent, KeysPipe],
  entryComponents: [
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
  ],
})
export class EntitySubrecordModule {}
