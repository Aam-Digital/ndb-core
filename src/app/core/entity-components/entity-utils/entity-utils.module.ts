import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisplayEntityComponent } from "./display-entity/display-entity.component";
import { ViewModule } from "../../view/view.module";
import { ChildrenModule } from "../../../child-dev-project/children/children.module";
import { SchoolsModule } from "../../../child-dev-project/schools/schools.module";

@NgModule({
  declarations: [DisplayEntityComponent],
  imports: [CommonModule, ViewModule, ChildrenModule, SchoolsModule],
  entryComponents: [DisplayEntityComponent],
})
export class EntityUtilsModule {}
