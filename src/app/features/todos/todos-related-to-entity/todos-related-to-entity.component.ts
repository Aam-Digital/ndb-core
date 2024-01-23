import { Component } from "@angular/core";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Todo } from "../model/todo";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { FilterService } from "../../../core/filter/filter.service";

@DynamicComponent("TodosRelatedToEntity")
@Component({
  selector: "app-todos-related-to-entity",
  templateUrl: "./todos-related-to-entity.component.html",
  styleUrls: ["./todos-related-to-entity.component.scss"],
  standalone: true,
  imports: [EntitiesTableComponent, MatSlideToggleModule, FormsModule],
})
export class TodosRelatedToEntityComponent extends RelatedEntitiesComponent<Todo> {
  override entityCtr = Todo;
  override _columns: FormFieldConfig[] = [
    { id: "deadline" },
    { id: "subject" },
    { id: "startDate" },
    { id: "assignedTo" },
    { id: "description", visibleFrom: "xl" },
    { id: "repetitionInterval", visibleFrom: "xl" },
    { id: "relatedEntities", hideFromTable: true },
    { id: "completed", hideFromForm: true },
  ];

  // TODO: filter by current user as default in UX? --> custom filter component or some kind of variable interpolation?
  override filter: DataFilter<Todo> = { isActive: true };
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
    entityMapper: EntityMapperService,
    entities: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
    filterService: FilterService,
  ) {
    super(entityMapper, entities, screenWidthObserver, filterService);
  }

  override getData() {
    if (Array.isArray(this.property)) {
      return;
    }

    // TODO: move this generic index creation into schema
    this.dbIndexingService.generateIndexOnProperty(
      "todo_index",
      Todo,
      this.property as keyof Todo,
      "deadline",
    );
    const entityId = this.entity.getId(true);
    return this.dbIndexingService.queryIndexDocs(
      Todo,
      "todo_index/by_" + this.property,
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
      newEntry.relatedEntities = [this.entity.getId(true)];
      return newEntry;
    };
  }

  showDetails(entity: Todo) {
    this.formDialog.openFormPopup(entity, this.columns, TodoDetailsComponent);
  }
}
