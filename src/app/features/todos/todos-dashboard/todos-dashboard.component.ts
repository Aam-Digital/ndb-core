import { Component, Input } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Todo } from "../model/todo";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import moment from "moment";
import { DashboardListWidgetComponent } from "../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { DatePipe, NgStyle } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { DashboardWidget } from "../../../core/dashboard/dashboard-widget/dashboard-widget";

@DynamicComponent("TodosDashboard")
@Component({
  selector: "app-todos-dashboard",
  templateUrl: "./todos-dashboard.component.html",
  styleUrls: ["./todos-dashboard.component.scss"],
  standalone: true,
  imports: [
    DashboardListWidgetComponent,
    NgStyle,
    MatTableModule,
    MatTooltipModule,
    DatePipe,
  ],
})
export class TodosDashboardComponent extends DashboardWidget {
  static override getRequiredEntities() {
    return Todo.ENTITY_TYPE;
  }

  dataMapper: (data: Todo[]) => Todo[] = (data) =>
    data.filter(this.filterEntries).sort(this.sortEntries);

  startDateLabel: string = Todo.schema.get("startDate").label;

  @Input() subtitle: string;
  @Input() explanation: string;

  constructor(
    private formDialog: FormDialogService,
    private currentUser: CurrentUserSubject,
  ) {
    super();
  }

  filterEntries = (todo: Todo) => {
    return (
      !todo.completed &&
      todo.assignedTo.includes(this.currentUser.value?.getId()) &&
      moment(todo.startDate).isSameOrBefore(moment(), "days")
    );
  };

  sortEntries = (a: Todo, b: Todo) => {
    // list overdue todos first
    if (a.isOverdue && b.isOverdue) {
      return a.deadline?.getTime() - b.deadline?.getTime();
    } else if (a.isOverdue) {
      return -1; // a first
    } else if (b.isOverdue) {
      return 1; // b first
    }

    return (
      (a.startDate ?? a.deadline)?.getTime() -
      (b.startDate ?? b.deadline)?.getTime()
    );
  };

  openEntity(entity: Todo) {
    this.formDialog.openFormPopup(entity, undefined, TodoDetailsComponent);
  }
}
