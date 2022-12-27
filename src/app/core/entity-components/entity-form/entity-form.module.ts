import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityFormComponent } from "./entity-form/entity-form.component";
import { EntityFormService } from "./entity-form.service";
import { MatButtonModule } from "@angular/material/button";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTabsModule } from "@angular/material/tabs";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatChipsModule } from "@angular/material/chips";

@NgModule({
  declarations: [EntityFormComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    ViewModule,
    PermissionsModule,
    MatTabsModule,
    MatTooltipModule,
    MatFormFieldModule,
    FontAwesomeModule,
    MatChipsModule,
  ],
  providers: [EntityFormService],
  exports: [EntityFormComponent],
})
export class EntityFormModule {}
