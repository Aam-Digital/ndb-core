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
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
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

  readonly completedBy = resource({
    params: () => this.value()?.completedBy,
    // Must NOT use `async` here: when this class field initializer is compiled,
    // an async arrow gets transformed into a helper that hoists `var _this = this`
    // above the implicit `super(...arguments)` call in the constructor, causing
    // "Must call super constructor in derived class before accessing 'this'".
    // Return a Promise explicitly instead.
    loader: ({ params: entityId }) => {
      if (!entityId) return Promise.resolve(undefined);
      const entityType = Entity.extractTypeFromId(entityId);
      return this.entityMapper.load(entityType, entityId);
    },
  });
}
