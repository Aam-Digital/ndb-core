import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Entity } from "../../../core/entity/model/entity";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Todo } from "../model/todo";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { HistoricalEntityData } from "../../historical-data/model/historical-entity-data";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { SessionService } from "../../../core/session/session-service/session.service";

@DynamicComponent("TasksRelatedToEntity")
@Component({
  selector: "app-tasks-related-to-entity",
  templateUrl: "./tasks-related-to-entity.component.html",
  styleUrls: ["./tasks-related-to-entity.component.scss"],
})
export class TasksRelatedToEntityComponent implements OnInitDynamicComponent {
  entries: Todo[] = [];

  columns: FormFieldConfig[] = [
    { id: "deadline" },
    { id: "subject" },
    { id: "assignedTo" },
    { id: "description", visibleFrom: "xl" },
    { id: "repetitionInterval", visibleFrom: "xl" },
    { id: "relatedEntities", hideFromTable: true },
  ];

  private entity: Entity;

  /** the property name of the Todo that contains the ids referencing related entities */
  private referenceProperty: string = "relatedEntities";

  constructor(
    private dbIndexingService: DatabaseIndexingService,
    private sessionService: SessionService
  ) {
    this.createIndex();
  }

  // TODO: filter by current user as default in UX? --> custom filter component or some kind of variable interpolation?

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config?.columns ?? this.columns;

    this.entries = await this.loadDataFor(this.entity.getId(true));
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
          // TODO: defaulting to current date if no deadline is set is not good! Because this happens only once at index creation
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
}
