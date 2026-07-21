import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "app/utils/related-entities-default-config";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { Todo } from "../model/todo";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";

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

  override entityCtr = signal(Todo);
  override loaderMethod = input(LoaderMethod.TodosRelatedToEntity);

  protected override getDefaultColumns(): FormFieldConfig[] {
    return RELATED_ENTITIES_DEFAULT_CONFIGS["TodosRelatedToEntity"].columns;
  }

  backgroundColorFn = (r: Todo) => {
    if (!r.isActive) {
      return "#e0e0e0";
    } else {
      return r.getColor();
    }
  };

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
