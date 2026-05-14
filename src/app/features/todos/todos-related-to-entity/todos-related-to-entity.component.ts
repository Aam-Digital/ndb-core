import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  backgroundColorFn = (r: Todo) => {
    if (!r.isActive) {
      return "#e0e0e0";
    } else {
      return r.getColor();
    }
  };

  override getData() {
    if (Array.isArray(this.relationProperty)) {
      return super.getData();
    }

    // TODO: move this generic index creation into schema
    const relationProperty = this.relationProperty as keyof Todo;
    this.dbIndexingService.generateIndexOnProperty(
      "todo_index",
      Todo,
      relationProperty,
      "deadline",
    );
    const entityId = this.entity()?.getId();
    if (!entityId) {
      return Promise.resolve([]);
    }
    return this.dbIndexingService.queryIndexDocs(
      Todo,
      "todo_index/by_" + relationProperty,
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
      const entityId = this.entity()?.getId();
      newEntry.relatedEntities = entityId ? [entityId] : [];
      return newEntry;
    };
  }

  protected override initFilter(): DataFilter<Todo> {
    return { isActive: true, ...super.initFilter() };
  }

  showDetails(entity: Todo) {
    this.formDialog.openView(entity);
  }
}
