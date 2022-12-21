import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PublicFormComponent } from "./public-form/public-form.component";
import { EntityFormModule } from "../../core/entity-components/entity-form/entity-form.module";

@NgModule({
  declarations: [PublicFormComponent],
  imports: [CommonModule, EntityFormModule],
})
export class PublicFormModule {}
