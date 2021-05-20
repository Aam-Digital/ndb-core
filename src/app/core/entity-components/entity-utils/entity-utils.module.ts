import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisplayEntityComponent } from "./display-entity/display-entity.component";
import { ViewModule } from "../../view/view.module";
import { DisplayEntityArrayComponent } from "./display-entity-array/display-entity-array.component";

@NgModule({
  declarations: [DisplayEntityComponent, DisplayEntityArrayComponent],
  imports: [CommonModule, ViewModule],
  entryComponents: [DisplayEntityComponent, DisplayEntityArrayComponent],
  exports: [DisplayEntityComponent],
})
export class EntityUtilsModule {}
