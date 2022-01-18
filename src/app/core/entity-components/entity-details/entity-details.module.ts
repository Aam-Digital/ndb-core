import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityDetailsComponent } from "./entity-details.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatExpansionModule } from "@angular/material/expansion";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatNativeDateModule } from "@angular/material/core";
import { ViewModule } from "../../view/view.module";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { FormComponent } from "./form/form.component";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { MatTabsModule } from "@angular/material/tabs";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { EntityUtilsModule } from "../entity-utils/entity-utils.module";

@NgModule({
  declarations: [EntityDetailsComponent, FormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatExpansionModule,
    ViewModule,
    FlexLayoutModule,
    MatButtonModule,
    MatSnackBarModule,
    MatNativeDateModule,
    EntityModule,
    AlertsModule,
    PermissionsModule,
    MatTooltipModule,
    EntityFormModule,
    Angulartics2Module,
    MatTabsModule,
    MatMenuModule,
    FontAwesomeModule,
    EntityUtilsModule,
  ],
  entryComponents: [FormComponent],
})
export class EntityDetailsModule {}
