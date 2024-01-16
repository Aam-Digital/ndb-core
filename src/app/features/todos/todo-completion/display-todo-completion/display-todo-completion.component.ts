import { Component, Input, OnInit } from "@angular/core";
import { TodoCompletion } from "../../model/todo-completion";
import { DatePipe, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../../core/entity/model/entity";
import { User } from "../../../../core/user/user";

@Component({
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
  standalone: true,
  imports: [NgIf, FontAwesomeModule, DatePipe],
})
export class DisplayTodoCompletionComponent implements OnInit {
  @Input() value: TodoCompletion;
  completedBy: Entity;
  constructor(private entityMapper: EntityMapperService) {}

  ngOnInit() {
    const entityId = this.value.completedBy;
    const entityType = entityId.includes(":")
      ? Entity.extractTypeFromId(entityId)
      : User;
    this.entityMapper
      .load(entityType, entityId)
      .then((res) => (this.completedBy = res));
  }
}
