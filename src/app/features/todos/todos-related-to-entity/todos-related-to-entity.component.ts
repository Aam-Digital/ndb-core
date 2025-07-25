import { Component, inject } from "@angular/core";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Todo } from "../model/todo";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { FilterService } from "../../../core/filter/filter.service";
import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "app/utils/related-entities-default-config";

@DynamicComponent("TodosRelatedToEntity")
@Component({
  selector: "app-todos-related-to-entity",
  templateUrl: "./todos-related-to-entity.component.html",
  styleUrls: ["./todos-related-to-entity.component.scss"],
  imports: [EntitiesTableComponent, MatSlideToggleModule, FormsModule],
})
export class TodosRelatedToEntityComponent extends RelatedEntitiesComponent<Todo> {
  private formDialog = inject(FormDialogService);
  private dbIndexingService = inject(DatabaseIndexingService);

  override entityCtr = Todo;
  override _columns: FormFieldConfig[] =
    RELATED_ENTITIES_DEFAULT_CONFIGS["TodosRelatedToEntity"].columns;

  // TODO: filter by current user as default in UX? --> custom filter component or some kind of variable interpolation?
  override filter: DataFilter<Todo> = { isActive: true };
  backgroundColorFn = (r: Todo) => {
    if (!r.isActive) {
      return "#e0e0e0";
    } else {
      return r.getColor();
    }
  };

  override getData() {
    if (Array.isArray(this.property)) {
      return super.getData();
    }

    // TODO: move this generic index creation into schema
    this.dbIndexingService.generateIndexOnProperty(
      "todo_index",
      Todo,
      this.property as keyof Todo,
      "deadline",
    );
    const entityId = this.entity.getId();
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
      newEntry.relatedEntities = [this.entity.getId()];
      return newEntry;
    };
  }

  showDetails(entity: Todo) {
    this.formDialog.openView(entity);
  }
}
