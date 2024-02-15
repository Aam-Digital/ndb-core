import { Component, OnInit } from "@angular/core";
import { TodoCompletion } from "../../model/todo-completion";
import { DatePipe, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../../core/entity/model/entity";
import { ViewDirective } from "../../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayTodoCompletion")
@Component({
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
  standalone: true,
  imports: [NgIf, FontAwesomeModule, DatePipe],
})
export class DisplayTodoCompletionComponent
  extends ViewDirective<TodoCompletion>
  implements OnInit
{
  completedBy: Entity;

  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  ngOnInit() {
    if (this.value?.completedBy) {
      const entityId = this.value.completedBy;
      const entityType = Entity.extractTypeFromId(entityId);
      this.entityMapper
        .load(entityType, entityId)
        .then((res) => (this.completedBy = res));
    }
  }
}
