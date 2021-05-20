import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisplayEntityComponent } from "./display-entity/display-entity.component";
import { ViewModule } from "../../view/view.module";

@NgModule({
  declarations: [DisplayEntityComponent],
  imports: [CommonModule, ViewModule],
  entryComponents: [DisplayEntityComponent],
  exports: [DisplayEntityComponent],
})
export class EntityUtilsModule {}
