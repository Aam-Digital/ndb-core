import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
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
export class SchoolBlockComponent implements OnChanges {
  icon = School.icon;
  @Input() entity: School = new School("");
  @Input() entityId: string;
  @Input() linkDisabled: boolean;

  constructor(private entityMapper: EntityMapperService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.entity = await this.entityMapper.load(School, this.entityId);
    }
  }
}
