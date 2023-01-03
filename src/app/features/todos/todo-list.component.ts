import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Todo } from "./model/todo";
import { RouteTarget } from "../../app.routing";
import { EntityListConfig } from "../../core/entity-components/entity-list/EntityListConfig";
import { RouteData } from "../../core/view/dynamic-routing/view-config.interface";
import { SessionService } from "../../core/session/session-service/session.service";
import { FormDialogService } from "../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "./todo-details/todo-details.component";

@RouteTarget("TodoList")
@Component({
  selector: "app-todo-list",
  template: `
    <app-entity-list
      [listConfig]="listConfig"
      [entityConstructor]="entityConstructor"
      clickMode="none"
      (elementClick)="showDetails($event)"
      (addNewClick)="createNew()"
    ></app-entity-list>
  `,
})
export class TodoListComponent implements OnInit {
  // TODO: make this component obsolete by generalizing Entity and EntityList so that we can define a viewDetailsComponent on the entity that gets opened as popup

  listConfig: EntityListConfig;
  entityConstructor = Todo;

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private formDialog: FormDialogService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config)
    );
  }

  createNew() {
    const newEntity = new Todo();
    newEntity.assignedTo = [this.sessionService.getCurrentUser().name];
    this.showDetails(newEntity);
  }

  showDetails(entity: Todo) {
    this.formDialog.openSimpleForm(
      entity,
      this.listConfig.columns,
      TodoDetailsComponent
    );
  }
}
