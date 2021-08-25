import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityFormComponent } from "./entity-form/entity-form.component";
import { EntityFormService } from "./entity-form.service";
import { MatButtonModule } from "@angular/material/button";
import { FlexLayoutModule, FlexModule } from "@angular/flex-layout";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatTabsModule } from "@angular/material/tabs";

@NgModule({
  declarations: [EntityFormComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    FlexModule,
    ViewModule,
    PermissionsModule,
    FlexLayoutModule,
    MatTabsModule,
  ],
  providers: [EntityFormService],
  exports: [EntityFormComponent],
})
export class EntityFormModule {}
