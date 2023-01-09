import { Component } from "@angular/core";
import { DynamicComponent } from "app/core/view/dynamic-components/dynamic-component.decorator";
import { Todo } from "../model/todo";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { SessionService } from "../../../core/session/session-service/session.service";
import moment from "moment";
import { DashboardListWidgetComponent } from "../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { DatePipe, NgStyle } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";

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
    this.formDialog.openSimpleForm(entity, undefined, TodoDetailsComponent);
  }
}
