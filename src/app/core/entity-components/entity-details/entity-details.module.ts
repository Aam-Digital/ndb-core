import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityDetailsComponent } from "./entity-details.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatNativeDateModule } from "@angular/material/core";
import { ViewModule } from "../../view/view.module";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { FormComponent } from "./form/form.component";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { EntityUtilsModule } from "../entity-utils/entity-utils.module";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";

@NgModule({
  declarations: [EntityDetailsComponent, FormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatExpansionModule,
    ViewModule,
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
    MatProgressBarModule,
    TabStateModule,
  ],
})
export class EntityDetailsModule {
  static dynamicComponents = [EntityDetailsComponent, FormComponent];
}
