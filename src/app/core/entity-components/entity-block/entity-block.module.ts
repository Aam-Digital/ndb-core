import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityBlockComponent } from "./entity-block.component";
import { ViewModule } from "../../view/view.module";

@NgModule({
  declarations: [EntityBlockComponent],
  imports: [CommonModule, ViewModule],
  exports: [
    EntityBlockComponent
  ]
})
export class EntityBlockModule {}
