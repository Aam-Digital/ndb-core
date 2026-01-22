import { Component, OnInit, inject } from "@angular/core";
import { TodoCompletion } from "../../model/todo-completion";
import { CustomDatePipe } from "../../../../core/basic-datatypes/date/custom-date.pipe";
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
  imports: [FontAwesomeModule, CustomDatePipe],
})
export class DisplayTodoCompletionComponent
  extends ViewDirective<TodoCompletion>
  implements OnInit
{
  private entityMapper = inject(EntityMapperService);

  completedBy: Entity;

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
