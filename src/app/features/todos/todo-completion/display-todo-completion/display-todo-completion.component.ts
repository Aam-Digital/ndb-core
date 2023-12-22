import { Component, OnChanges, SimpleChanges } from "@angular/core";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../../core/entity/default-datatype/view.directive";
import { TodoCompletion } from "../../model/todo-completion";
import { DatePipe, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../../core/entity/model/entity";
import { User } from "../../../../core/user/user";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";

@DynamicComponent("DisplayTodoCompletion")
@Component({
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
  standalone: true,
  imports: [NgIf, FontAwesomeModule, DatePipe, DisplayEntityComponent],
})
export class DisplayTodoCompletionComponent
  extends ViewDirective<TodoCompletion>
  implements OnChanges
{
  completedBy: Entity;
  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    if (changes.hasOwnProperty("value") && this.value.completedBy) {
      const entityId = this.value.completedBy;
      const entityType = entityId.includes(":")
        ? Entity.extractTypeFromId(entityId)
        : User;
      this.entityMapper
        .load(entityType, entityId)
        .then((res) => (this.completedBy = res));
    }
  }
}
