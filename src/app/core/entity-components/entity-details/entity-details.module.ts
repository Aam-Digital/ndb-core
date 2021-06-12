import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityDetailsComponent } from "./entity-details.component";
import { FormComponent } from "./form/form.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MatExpansionModule } from "@angular/material/expansion";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatNativeDateModule } from "@angular/material/core";
import { ViewModule } from "../../view/view.module";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { EntitySelectModule } from "../entity-select/entity-select.module";
import { AppButtonsModule } from "../../app-buttons/app-buttons.module";

@NgModule({
  declarations: [EntityDetailsComponent, FormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSelectModule,
    MatExpansionModule,
    ViewModule,
    FlexLayoutModule,
    MatButtonModule,
    MatSnackBarModule,
    MatNativeDateModule,
    EntityModule,
    AlertsModule,
    ConfigurableEnumModule,
    PermissionsModule,
    EntitySelectModule,
    AppButtonsModule,
  ],
})
export class EntityDetailsModule {}
