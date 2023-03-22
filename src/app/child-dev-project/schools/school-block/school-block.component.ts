import { Component, Input, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../model/school";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { FaDynamicIconComponent } from "../../../core/view/fa-dynamic-icon/fa-dynamic-icon.component";

@DynamicComponent("SchoolBlock")
@Component({
  selector: "app-school-block",
  templateUrl: "./school-block.component.html",
  standalone: true,
  imports: [FaDynamicIconComponent],
})
export class SchoolBlockComponent implements OnInit {
  icon = School.icon;
  @Input() entity = new School("");
  @Input() entityId: string;
  @Input() linkDisabled = false;

  constructor(private entityMapper: EntityMapperService) {}

  async ngOnInit() {
    if (this.entityId) {
      this.entity = await this.entityMapper.load(School, this.entityId);
    }
  }
}
