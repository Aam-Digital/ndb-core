import { Component } from "@angular/core";
import { DynamicComponent } from "app/core/view/dynamic-components/dynamic-component.decorator";
import { Todo } from "../model/todo";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { SessionService } from "../../../core/session/session-service/session.service";
import { Entity } from "../../../core/entity/model/entity";
import moment from "moment";

@DynamicComponent("TodosDashboard")
@Component({
  selector: "app-todos-dashboard",
  templateUrl: "./todos-dashboard.component.html",
  styleUrls: ["./todos-dashboard.component.scss"],
})
export class TodosDashboardComponent implements OnInitDynamicComponent {
  dataMapper: (data: Todo[]) => Todo[] = (data) =>
    data.filter(this.filterEntries).sort(this.sortEntries);

  startDateLabel: string = Todo.schema.get("startDate").label;

  constructor(
    private formDialog: FormDialogService,
    private sessionService: SessionService
  ) {}

  onInitFromDynamicConfig(config: any) {}

  filterEntries = (todo: Todo) => {
    return (
      !todo.completed &&
      todo.assignedTo.includes(this.sessionService.getCurrentUser().name) &&
      moment(todo.startDate).isSameOrBefore(moment(), "days")
    );
  };

  sortEntries = (a: Todo, b: Todo) => {
    if (a.isOverdue || b.isOverdue) {
      // list overdue todos first
      return a.deadline?.getTime() - b.deadline?.getTime();
    }
    return (
      (a.startDate ?? a.deadline)?.getTime() -
      (b.startDate ?? b.deadline)?.getTime()
    );
  };

  openEntity(entity: Todo) {
    // TODO: maybe mark within schema which fields should be displayed in default details view or access the view:todo/:id config here?
    const excludedFields = [...Array.from(Entity.schema.keys()), "completed"];

    this.formDialog.openSimpleForm(
      entity,
      Array.from(entity.getSchema().keys()).filter(
        (k) => !excludedFields.includes(k)
      ),
      TodoDetailsComponent
    );
  }
}
