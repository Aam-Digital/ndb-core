import { Component, Input, inject } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Todo } from "../model/todo";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import moment from "moment";
import { DashboardListWidgetComponent } from "../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { NgStyle } from "@angular/common";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { DashboardWidget } from "../../../core/dashboard/dashboard-widget/dashboard-widget";

@DynamicComponent("TodosDashboard")
@Component({
  selector: "app-todos-dashboard",
  templateUrl: "./todos-dashboard.component.html",
  styleUrls: ["./todos-dashboard.component.scss"],
  imports: [
    DashboardListWidgetComponent,
    NgStyle,
    MatTableModule,
    MatTooltipModule,
    CustomDatePipe,
  ],
})
export class TodosDashboardComponent extends DashboardWidget {
  private formDialog = inject(FormDialogService);
  private currentUser = inject(CurrentUserSubject);

  static override getRequiredEntities() {
    return Todo.ENTITY_TYPE;
  }

  dataMapper: (data: Todo[]) => Todo[] = (data) =>
    data.filter(this.filterEntries).sort(this.sortEntries);

  startDateLabel: string = Todo.schema.get("startDate").label;

  @Input() subtitle: string = $localize`:dashboard widget subtitle:Tasks due`;
  @Input() explanation: string =
    $localize`:dashboard widget explanation:Tasks that are beyond their deadline`;

  filterEntries = (todo: Todo) => {
    return (
      !todo.completed &&
      todo.isActive &&
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
    this.formDialog.openView(entity);
  }
}
