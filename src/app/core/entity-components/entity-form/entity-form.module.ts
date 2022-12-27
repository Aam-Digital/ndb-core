import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityFormComponent } from "./entity-form/entity-form.component";
import { EntityFormService } from "./entity-form.service";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";

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
