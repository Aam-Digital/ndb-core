import {
  Component,
  inject,
  resource,
  ChangeDetectionStrategy,
} from "@angular/core";
import { TodoCompletion } from "../../model/todo-completion";
import { CustomDatePipe } from "../../../../core/basic-datatypes/date/custom-date.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../../core/entity/model/entity";
import { ViewDirective } from "../../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayTodoCompletion")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
  imports: [FontAwesomeModule, CustomDatePipe],
})
export class DisplayTodoCompletionComponent extends ViewDirective<TodoCompletion> {
  private readonly entityMapper = inject(EntityMapperService);

  completedBy = resource({
    params: () => this.value()?.completedBy,
    loader: async ({ params: entityId }) => {
      if (!entityId) return undefined;
      const entityType = Entity.extractTypeFromId(entityId);
      return this.entityMapper.load(entityType, entityId);
    },
  });
}
