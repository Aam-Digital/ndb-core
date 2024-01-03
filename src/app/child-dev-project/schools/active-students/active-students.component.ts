import { Component, OnChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ChildrenService } from "../../children/children.service";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

@DynamicComponent("DisplayActiveStudents")
@Component({
  selector: "app-active-students",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./active-students.component.html",
  styleUrl: "./active-students.component.scss",
})
export class ActiveStudentsComponent
  extends ViewDirective<any>
  implements OnChanges
{
  data: ChildSchoolRelation[];
  constructor(private childrenService: ChildrenService) {
    super();
  }

  async ngOnChanges() {
    super.ngOnChanges();
    this.data = await this.childrenService.queryActiveRelationsOf(
      "school",
      this.entity.getId(),
    );
    console.log("data", this.data);
  }
}
