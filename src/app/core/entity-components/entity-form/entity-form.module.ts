import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityFormComponent } from "./entity-form/entity-form.component";
import { EntityFormService } from "./entity-form.service";
import { MatButtonModule } from "@angular/material/button";
import { FlexModule } from "@angular/flex-layout";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";

@NgModule({
  declarations: [EntityFormComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    FlexModule,
    ViewModule,
    PermissionsModule,
  ],
  providers: [EntityFormService],
  entryComponents: [EntityFormComponent],
})
export class EntityFormModule {}
