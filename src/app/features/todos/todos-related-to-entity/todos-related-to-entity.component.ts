import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Entity } from "../../../core/entity/model/entity";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Todo } from "../model/todo";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { SessionService } from "../../../core/session/session-service/session.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { DataFilter } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

@DynamicComponent("TodosRelatedToEntity")
@Component({
  selector: "app-todos-related-to-entity",
  templateUrl: "./todos-related-to-entity.component.html",
  styleUrls: ["./todos-related-to-entity.component.scss"],
})
export class TodosRelatedToEntityComponent implements OnInitDynamicComponent {
  entries: Todo[] = [];

  columns: FormFieldConfig[] = [
    { id: "deadline" },
    { id: "subject" },
    { id: "startDate" },
    { id: "assignedTo" },
    { id: "description", visibleFrom: "xl" },
    { id: "repetitionInterval", visibleFrom: "xl" },
    { id: "relatedEntities", hideFromTable: true },
    { id: "completed", hideFromForm: true },
  ];

  private entity: Entity;

  /** the property name of the Todo that contains the ids referencing related entities */
  private referenceProperty: string = "relatedEntities";

  showInactive: boolean;

  // TODO: filter by current user as default in UX? --> custom filter component or some kind of variable interpolation?
  filter: DataFilter<Todo> = { isActive: true };
  includeInactive: boolean;
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
    private sessionService: SessionService
  ) {
    this.createIndex();
  }

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config?.columns ?? this.columns;

    this.entries = await this.loadDataFor(this.entity.getId(true));
    this.toggleInactive();
  }

  private createIndex() {
    // TODO: move this generic index creation into schema + indexing service

    const designDoc = {
      _id: "_design/todo_index",
      views: {
        by_entity: {
          map: `(doc) => {
            if (!doc._id.startsWith("${Todo.ENTITY_TYPE}")) return;
            if (!Array.isArray(doc.${this.referenceProperty})) return;

            var d = new Date(doc.deadline || null);
            var dateString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")

            doc.${this.referenceProperty}.forEach((relatedEntity) => {
              emit([relatedEntity, dateString]);
            });
          }`,
        },
      },
    };
    return this.dbIndexingService.createIndex(designDoc);
  }

  private loadDataFor(entityId: string): Promise<Todo[]> {
    return this.dbIndexingService.queryIndexDocs(Todo, "todo_index/by_entity", {
      startkey: [entityId, "\uffff"],
      endkey: [entityId],
      descending: true,
    });
  }

  public getNewEntryFunction(): () => Todo {
    return () => {
      const newEntry = new Todo();
      newEntry.relatedEntities = [this.entity.getId(true)];
      newEntry.assignedTo = [this.sessionService.getCurrentUser().name];
      return newEntry;
    };
  }

  showDetails(entity: Todo) {
    this.formDialog.openSimpleForm(entity, this.columns, TodoDetailsComponent);
  }

  toggleInactive() {
    // TODO: move the toggle into its own component to be used like a filter? this is almost copy & paste from ChildSchoolOverview
    if (this.includeInactive) {
      this.filter = {};
    } else {
      this.filter = { isActive: true };
    }
  }
}
