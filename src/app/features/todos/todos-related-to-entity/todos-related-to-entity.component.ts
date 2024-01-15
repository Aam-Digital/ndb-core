import { Component, Input, OnInit } from "@angular/core";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Entity } from "../../../core/entity/model/entity";
import { Todo } from "../model/todo";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { DataFilter } from "../../../core/filter/filters/filters";

@DynamicComponent("TodosRelatedToEntity")
@Component({
  selector: "app-todos-related-to-entity",
  templateUrl: "./todos-related-to-entity.component.html",
  styleUrls: ["./todos-related-to-entity.component.scss"],
  standalone: true,
  imports: [EntitiesTableComponent, MatSlideToggleModule, FormsModule],
})
export class TodosRelatedToEntityComponent implements OnInit {
  entries: Todo[];
  entityCtr = Todo;

  @Input() entity: Entity;
  @Input() columns: FormFieldConfig[] = [
    { id: "deadline" },
    { id: "subject" },
    { id: "startDate" },
    { id: "assignedTo" },
    { id: "description", visibleFrom: "xl" },
    { id: "repetitionInterval", visibleFrom: "xl" },
    { id: "relatedEntities", hideFromTable: true },
    { id: "completed", hideFromForm: true },
  ];

  /** the property name of the Todo that contains the ids referencing related entities */
  private referenceProperty: keyof Todo & string = "relatedEntities";

  showInactive: boolean;

  // TODO: filter by current user as default in UX? --> custom filter component or some kind of variable interpolation?
  filter: DataFilter<Todo> = { isActive: true };
  backgroundColorFn = (r: Todo) => {
    if (!r.isActive) {
      return "#e0e0e0";
    } else {
      return r.getColor();
    }
  };

  constructor(
    private formDialog: FormDialogService,
    private dbIndexingService: DatabaseIndexingService,
  ) {
    // TODO: move this generic index creation into schema
    this.dbIndexingService.generateIndexOnProperty(
      "todo_index",
      Todo,
      this.referenceProperty,
      "deadline",
    );
  }

  async ngOnInit() {
    this.entries = await this.loadDataFor(this.entity.getId());
  }

  private async loadDataFor(entityId: string): Promise<Todo[]> {
    return this.dbIndexingService.queryIndexDocs(
      Todo,
      "todo_index/by_" + this.referenceProperty,
      {
        startkey: [entityId, "\uffff"],
        endkey: [entityId],
        descending: true,
      },
    );
  }

  public getNewEntryFunction(): () => Todo {
    return () => {
      const newEntry = new Todo();
      newEntry.relatedEntities = [this.entity.getId()];
      return newEntry;
    };
  }

  showDetails(entity: Todo) {
    this.formDialog.openFormPopup(entity, this.columns, TodoDetailsComponent);
  }
}
